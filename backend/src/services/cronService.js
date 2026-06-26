import cron from 'node-cron';
import { getSettings, getSettingsForUser, setCronActive, addLog, getClusterState, updateClusterState } from '../utils/database.js';
import { CLUSTER_MAX_SUPPORTING } from './promptStyle.js';
import { generatePostContent } from './contentGenerationService.js';
import { postToWordPress, uploadImageToWordPress, setFeaturedImageForPost } from './wordpressService.js';
import { getUserCredentialsForPosting, getAiProviderAndKey } from './userCredentialsService.js';
import { getYoastKeywords } from './yoastService.js';
import { fetchImageFromUnsplash, downloadImageBuffer, getImageFilename } from './imageService.js';
import { getTrendingTopic, getTrendingKeywords } from './trendingService.js';

let cronJob = null;
let currentUserId = null;
let nicheIndex = 0; // Rolling index for niche round-robin

/**
 * Parse niche string into an array of individual niches.
 * Supports comma-separated values: "MPASI, Parenting, Investasi"
 * @param {string} nicheStr - Raw niche string from user settings
 * @returns {string[]} Array of trimmed, non-empty niche keywords
 */
function parseNicheList(nicheStr) {
  if (!nicheStr || !String(nicheStr).trim()) return [];
  return String(nicheStr)
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);
}

/**
 * Pick the next niche from the list using round-robin (cycling).
 * Each call advances the global nicheIndex counter.
 * @param {string[]} niches - Array of niche keywords
 * @returns {string} The selected niche for this run
 */
function pickNicheRoundRobin(niches) {
  if (!niches || niches.length === 0) return '';
  if (niches.length === 1) return niches[0];
  const picked = niches[nicheIndex % niches.length];
  nicheIndex = (nicheIndex + 1) % niches.length;
  console.log(`🔄 [Niche Rolling] Picked: "${picked}" (index ${nicheIndex - 1 < 0 ? niches.length - 1 : nicheIndex - 1}/${niches.length - 1})`);
  return picked;
}

// ─── TOPIC CLUSTER HELPERS ────────────────────────────────────────────────────

/**
 * Convert a niche string to a stable key for cluster state storage.
 */
function toNicheKey(niche) {
  return String(niche || '').toLowerCase().trim().replace(/\s+/g, '_');
}

/**
 * Determine whether this run should create a pillar or supporting article.
 * Returns a clusterContext object (or null if niche not set).
 * @param {string} userId
 * @param {string} activeNiche - the niche picked for this run
 * @returns {{ mode: 'pillar'|'supporting', niche, nicheKey, pillarTitle?, pillarUrl?, supportingIndex, fullState }}
 */
function resolveClusterContext(userId, activeNiche) {
  if (!activeNiche) return null;

  const nicheKey = toNicheKey(activeNiche);
  const fullState = getClusterState(userId);
  const nicheState = fullState[nicheKey];

  const needsNewPillar =
    !nicheState ||
    !nicheState.pillarUrl ||
    (nicheState.supportingCount || 0) >= CLUSTER_MAX_SUPPORTING;

  if (needsNewPillar) {
    console.log(`📊 [Cluster] Starting NEW PILLAR for niche "${activeNiche}"`);
    return { mode: 'pillar', niche: activeNiche, nicheKey, supportingIndex: 0, fullState };
  }

  const supportingIndex = nicheState.supportingCount || 0;
  console.log(`📎 [Cluster] SUPPORTING #${supportingIndex + 1}/${CLUSTER_MAX_SUPPORTING} for niche "${activeNiche}" → pillar: "${nicheState.pillarTitle}"`);
  return {
    mode: 'supporting',
    niche: activeNiche,
    nicheKey,
    pillarTitle: nicheState.pillarTitle,
    pillarUrl: nicheState.pillarUrl,
    pillarPostId: nicheState.pillarPostId,
    supportingIndex,
    fullState
  };
}

/**
 * Save cluster state after a successful post.
 * @param {string} userId
 * @param {object} clusterContext
 * @param {{ title: string, link: string, postId: number }} postResult
 */
function saveClusterStateAfterPost(userId, clusterContext, postResult) {
  if (!clusterContext || !postResult?.link) return;

  const { mode, nicheKey, fullState, supportingIndex } = clusterContext;

  if (mode === 'pillar') {
    fullState[nicheKey] = {
      pillarTitle: postResult.title,
      pillarUrl: postResult.link,
      pillarPostId: postResult.postId,
      supportingCount: 0,
      createdAt: new Date().toISOString()
    };
    console.log(`✅ [Cluster] Pillar saved: "${postResult.title}" → ${postResult.link}`);
  } else {
    const existing = fullState[nicheKey] || {};
    fullState[nicheKey] = {
      ...existing,
      supportingCount: supportingIndex + 1
    };
    console.log(`✅ [Cluster] Supporting #${supportingIndex + 1} saved for niche "${clusterContext.niche}"`);
  }

  updateClusterState(userId, fullState);
}

function getProviderApiKey(credentials) {
  return credentials.aiProvider === 'gemini' ? credentials.geminiKey :
    credentials.aiProvider === 'sumopod' ? credentials.sumopodKey :
    credentials.aiProvider === 'chatgpt' ? credentials.chatgptKey :
    credentials.aiProvider === 'claude' ? credentials.claudeKey :
    null;
}

function mergeSeoKeywords(aiKeywords = [], trendingKeywords = [], topic = '') {
  const clean = (arr) => (Array.isArray(arr) ? arr : [])
    .map(k => String(k || '').trim())
    .filter(Boolean);

  const ai = clean(aiKeywords);
  const trends = clean(trendingKeywords);
  const topicClean = String(topic || '').trim();

  const toTokens = (text) => String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3);

  // Only keep trending keywords that are topically relevant, otherwise the
  // day's general trends (same for everyone) would become identical tags on
  // every post.
  const topicTokens = new Set([...toTokens(topicClean), ...ai.flatMap(toTokens)]);
  const relevantTrends = trends.filter(t =>
    toTokens(t).some(tok => topicTokens.has(tok))
  );

  // Post-specific AI keywords first, then the topic, then only relevant trends.
  return [...new Set(
    [...ai, topicClean, ...relevantTrends].filter(Boolean)
  )].slice(0, 6);
}

function validateSeoGuardrails(postContent, topic) {
  const title = String(postContent?.title || '');
  const meta = String(postContent?.metaDescription || '');
  const content = String(postContent?.content || '');
  const keywords = Array.isArray(postContent?.keywords) ? postContent.keywords : [];
  const primaryKeyword = String(keywords[0] || topic || '').toLowerCase();

  const issues = [];
  if (title.length < 45 || title.length > 65) issues.push('Title length should be around 50-60 characters');
  if (meta.length < 140 || meta.length > 165) issues.push('Meta description length should be around 150-160 characters');
  if (!content.includes('<h2')) issues.push('Content must include H2 sections');
  if (!content.includes('<h3')) issues.push('Content should include H3 subsections');
  if (!content.includes('<ul') && !content.includes('<ol')) issues.push('Content should include list elements');

  // Rough word count check
  const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (wordCount < 1000) issues.push('Content is too short; target at least 1200-1500 words');

  // Keyword placement in first 120 words
  const introChunk = content.replace(/<[^>]+>/g, ' ').split(/\s+/).slice(0, 120).join(' ').toLowerCase();
  if (primaryKeyword && !introChunk.includes(primaryKeyword.split(' ')[0])) {
    issues.push('Primary keyword should appear early in the introduction');
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

async function generateSeoPostWithGuardrails({ provider, apiKey, topic, contentLanguage, sumopodModel, clusterContext = null }) {
  const generationOptions = provider === 'sumopod' ? { model: sumopodModel } : {};
  if (clusterContext) generationOptions.clusterContext = clusterContext;

  let postContent = await generatePostContent(provider, apiKey, topic, contentLanguage, '', generationOptions);
  const firstPass = validateSeoGuardrails(postContent, topic);
  if (firstPass.passed) return postContent;

  const refinementHint = `Regenerate and fix these SEO issues:
- ${firstPass.issues.join('\n- ')}
Keep the output strictly valid JSON with complete HTML content.`;

  console.log(`⚠️  [SEO Guardrail] First draft below threshold, regenerating once...`);
  postContent = await generatePostContent(provider, apiKey, topic, contentLanguage, refinementHint, generationOptions);
  return postContent;
}

export async function startCronJob(userId) {
  if (cronJob) {
    console.log('Cron job already running');
    return false;
  }

  if (!userId) {
    throw new Error('User ID is required to start cron job');
  }

  // Validate that user has credentials configured
  try {
    await getUserCredentialsForPosting(userId);
  } catch (error) {
    throw new Error(`Cannot start cron job: ${error.message}`);
  }

  currentUserId = userId;

  // Get interval from Supabase settings (default 12 hours)
  const settings = await getSettingsForUser(userId);
  const hours = settings.interval_waktu || 12;
  
  cronJob = cron.schedule(`0 */${hours} * * *`, async () => {
    await runAutoPost();
  });

  await setCronActive(true);
  console.log(`✅ Cron job started for user ${userId} - runs every ${hours} hours`);
  return true;
}

export async function stopCronJob() {
  try {
    if (cronJob) {
      cronJob.stop();
      cronJob = null;
      currentUserId = null;
    }
    
    // ALWAYS update database, even if job not running in memory
    // (handles case when server restarted but cronActive still true)
    await setCronActive(false);
    console.log('❌ Cron job stopped (memory state may have differed)');
    return true;
  } catch (error) {
    console.error('Error stopping cron job:', error);
    throw error;
  }
}

export function isCronJobRunning() {
  return cronJob !== null && cronJob._scheduler ? true : false;
}

async function runAutoPost() {
  if (!currentUserId) {
    console.error('❌ No user ID available for posting');
    return;
  }

  try {
    // Get encrypted credentials from Supabase and decrypt
    const credentials = await getUserCredentialsForPosting(currentUserId);
    
    const contentLanguage = credentials.contentLanguage || 'id';
    const seoTopicsByLanguage = {
      id: [
        'Strategi Digital Marketing',
        'Panduan Social Media Marketing',
        'Tips Optimasi SEO',
        'Strategi Email Marketing',
        'Cara Meningkatkan Conversion Rate',
        'Strategi Branding Bisnis',
        'Tips Produktivitas Kerja Remote',
        'Strategi Lead Generation',
        'Tips Customer Engagement',
        'Strategi Pertumbuhan Bisnis'
      ],
      en: [
        'Digital Marketing Strategy',
        'SEO Optimization Tips',
        'Social Media Marketing Guide',
        'Email Marketing Tactics',
        'Conversion Rate Optimization',
        'Brand Building Strategies',
        'Remote Work Productivity Tips',
        'Lead Generation Methods',
        'Customer Engagement Techniques',
        'Business Growth Strategies'
      ]
    };

    let topic;
    let activeNiche = '';
    if (credentials.trendingEnabled) {
      // Parse comma-separated niches and pick one via round-robin
      const nicheList = parseNicheList(credentials.trendingNiche || '');
      activeNiche = pickNicheRoundRobin(nicheList);
      if (nicheList.length > 1) {
        console.log(`🎯 [Niche Rolling] Niches available: [${nicheList.join(' | ')}]`);
      }
      topic = await getTrendingTopic(contentLanguage, activeNiche);
    } else {
      const list = seoTopicsByLanguage[contentLanguage] || seoTopicsByLanguage.id;
      topic = list[Math.floor(Math.random() * list.length)];
    }

    // Resolve cluster context (pillar vs supporting) based on niche history
    const clusterContext = resolveClusterContext(currentUserId, activeNiche);
    // For cluster posts, use the niche as topic so AI can pick the right sub-angle
    const effectiveTopic = clusterContext ? activeNiche || topic : topic;

    const postContent = await generateSeoPostWithGuardrails({
      provider: credentials.aiProvider,
      apiKey: getProviderApiKey(credentials),
      topic: effectiveTopic,
      contentLanguage,
      sumopodModel: credentials.sumopodModel,
      clusterContext
    });

    const trendingKeywords = credentials.trendingEnabled
      ? await getTrendingKeywords(contentLanguage, topic)
      : [];
    const mergedKeywords = mergeSeoKeywords(postContent.keywords, trendingKeywords, topic);
    
    // Extract SEO data from generated content
    const seoData = {
      seoScore: postContent.seoScore || 0,
      keywords: mergedKeywords,
      slug: postContent.slug || undefined,
      topic
    };

    const result = await postToWordPress(
      credentials.wpUrl,
      credentials.wpUser,
      credentials.wpPass,
      postContent.title,
      postContent.content,
      postContent.metaDescription || '',
      seoData
    );

    // Try to fetch and set featured image (optional by user setting)
    let imageData = null;
    if (credentials.includeImages !== false) {
      try {
        const primaryKeyword = seoData.keywords?.[0] || topic;
        const keywordBlob = (seoData.keywords || []).slice(0, 6).join(' ');
        const imageQuerySource = [
          String(primaryKeyword),
          String(keywordBlob),
          postContent.title,
          topic
        ].filter(Boolean).join(' ');
        const imagePrompt = imageQuerySource || `business ${topic.toLowerCase()}`;
        const imageInfo = await fetchImageFromUnsplash(imagePrompt);
        
        if (imageInfo) {
          const imageBuffer = await downloadImageBuffer(imageInfo.url);
          const filename = getImageFilename(imageInfo.url);
          
          const media = await uploadImageToWordPress(
            credentials.wpUrl,
            credentials.wpUser,
            credentials.wpPass,
            imageBuffer,
            filename,
            imageInfo.alt
          );
          
          await setFeaturedImageForPost(
            credentials.wpUrl,
            credentials.wpUser,
            credentials.wpPass,
            result.postId,
            media.id
          );
          
          imageData = {
            url: media.url,
            alt: media.alt,
            source: 'Unsplash'
          };
          console.log(`✅ Featured image added: ${media.url}`);
        }
      } catch (imageError) {
        console.log(`⚠️  Could not add featured image: ${imageError.message}`);
        // Continue without image - don't fail the entire post
      }
    } else {
      console.log(`ℹ️  [Image] Skipped (include_images=false)`);
    }

    // Try to get Yoast keywords from the posted article
    let finalKeywords = result.keywords || [topic];
    try {
      const yoastData = await getYoastKeywords(
        credentials.wpUrl,
        credentials.wpUser,
        credentials.wpPass,
        result.postId
      );
      
      if (yoastData.keywords && yoastData.keywords.length > 0) {
        finalKeywords = yoastData.keywords;
        console.log(`✅ Using Yoast keywords: ${finalKeywords.join(', ')}`);
      }
      
      if (yoastData.seo_score) {
        result.seoScore = yoastData.seo_score;
      }
    } catch (yoastError) {
      console.log(`ℹ️  Yoast keywords not available:`, yoastError.message);
      // Continue with generated keywords if Yoast fails
    }

    await addLog(currentUserId, {
      title: postContent.title,
      status: 'success',
      postId: result.postId,
      link: result.link,
      seoScore: result.seoScore,
      keywords: finalKeywords,
      imageUrl: imageData?.url
    });

    // Save cluster state after successful post
    saveClusterStateAfterPost(currentUserId, clusterContext, {
      title: postContent.title,
      link: result.link,
      postId: result.postId
    });

    console.log(`✅ Post published: ${result.title} (SEO Score: ${result.seoScore}/100)${clusterContext ? ` [${clusterContext.mode.toUpperCase()}]` : ''}`);
  } catch (error) {
    await addLog(currentUserId, {
      title: 'Auto Post',
      status: 'failed',
      error: error.message
    });
    console.error(`❌ Auto post failed: ${error.message}`);
  }
}

export async function runPostNow(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // Get encrypted credentials from Supabase and decrypt
    const credentials = await getUserCredentialsForPosting(userId);
    
    const contentLanguage = credentials.contentLanguage || 'id';
    const seoTopicsByLanguage = {
      id: [
        'Strategi Digital Marketing',
        'Panduan Social Media Marketing',
        'Tips Optimasi SEO',
        'Strategi Email Marketing',
        'Cara Meningkatkan Conversion Rate',
        'Strategi Branding Bisnis',
        'Tips Produktivitas Kerja Remote',
        'Strategi Lead Generation',
        'Tips Customer Engagement',
        'Strategi Pertumbuhan Bisnis'
      ],
      en: [
        'Digital Marketing Strategy',
        'SEO Optimization Tips',
        'Social Media Marketing Guide',
        'Email Marketing Tactics',
        'Conversion Rate Optimization',
        'Brand Building Strategies',
        'Remote Work Productivity Tips',
        'Lead Generation Methods',
        'Customer Engagement Techniques',
        'Business Growth Strategies'
      ]
    };

    let topic;
    let activeNiche = '';
    if (credentials.trendingEnabled) {
      // Parse comma-separated niches and pick one via round-robin
      const nicheList = parseNicheList(credentials.trendingNiche || '');
      activeNiche = pickNicheRoundRobin(nicheList);
      if (nicheList.length > 1) {
        console.log(`🎯 [Niche Rolling] Niches available: [${nicheList.join(' | ')}]`);
      }
      topic = await getTrendingTopic(contentLanguage, activeNiche);
    } else {
      const list = seoTopicsByLanguage[contentLanguage] || seoTopicsByLanguage.id;
      topic = list[Math.floor(Math.random() * list.length)];
    }

    // Resolve cluster context (pillar vs supporting) based on niche history
    const clusterContext = resolveClusterContext(userId, activeNiche);
    const effectiveTopic = clusterContext ? activeNiche || topic : topic;

    const postContent = await generateSeoPostWithGuardrails({
      provider: credentials.aiProvider,
      apiKey: getProviderApiKey(credentials),
      topic: effectiveTopic,
      contentLanguage,
      sumopodModel: credentials.sumopodModel,
      clusterContext
    });

    const trendingKeywords = credentials.trendingEnabled
      ? await getTrendingKeywords(contentLanguage, topic)
      : [];
    const mergedKeywords = mergeSeoKeywords(postContent.keywords, trendingKeywords, topic);
    
    // Extract SEO data from generated content
    const seoData = {
      seoScore: postContent.seoScore || 0,
      keywords: mergedKeywords,
      slug: postContent.slug || undefined,
      topic
    };

    const result = await postToWordPress(
      credentials.wpUrl,
      credentials.wpUser,
      credentials.wpPass,
      postContent.title,
      postContent.content,
      postContent.metaDescription || '',
      seoData
    );

    // Try to fetch and set featured image (optional by user setting)
    let imageData = null;
    if (credentials.includeImages !== false) {
      try {
        const primaryKeyword = seoData.keywords?.[0] || topic;
        const keywordBlob = (seoData.keywords || []).slice(0, 6).join(' ');
        const imageQuerySource = [
          String(primaryKeyword),
          String(keywordBlob),
          postContent.title,
          topic
        ].filter(Boolean).join(' ');
        const imagePrompt = imageQuerySource || `business ${topic.toLowerCase()}`;
        const imageInfo = await fetchImageFromUnsplash(imagePrompt);
        
        if (imageInfo) {
          const imageBuffer = await downloadImageBuffer(imageInfo.url);
          const filename = getImageFilename(imageInfo.url);
          
          const media = await uploadImageToWordPress(
            credentials.wpUrl,
            credentials.wpUser,
            credentials.wpPass,
            imageBuffer,
            filename,
            imageInfo.alt
          );
          
          await setFeaturedImageForPost(
            credentials.wpUrl,
            credentials.wpUser,
            credentials.wpPass,
            result.postId,
            media.id
          );
          
          imageData = {
            url: media.url,
            alt: media.alt,
            source: 'Unsplash'
          };
          console.log(`✅ Featured image added: ${media.url}`);
        }
      } catch (imageError) {
        console.log(`⚠️  Could not add featured image: ${imageError.message}`);
        // Continue without image - don't fail the entire post
      }
    } else {
      console.log(`ℹ️  [Image] Skipped (include_images=false)`);
    }

    // Try to get Yoast keywords from the posted article
    let finalKeywords = result.keywords || [topic];
    try {
      const yoastData = await getYoastKeywords(
        credentials.wpUrl,
        credentials.wpUser,
        credentials.wpPass,
        result.postId
      );
      
      if (yoastData.keywords && yoastData.keywords.length > 0) {
        finalKeywords = yoastData.keywords;
        console.log(`✅ Using Yoast keywords: ${finalKeywords.join(', ')}`);
      }
      
      if (yoastData.seo_score) {
        result.seoScore = yoastData.seo_score;
      }
    } catch (yoastError) {
      console.log(`ℹ️  Yoast keywords not available:`, yoastError.message);
      // Continue with generated keywords if Yoast fails
    }

    await addLog(userId, {
      title: postContent.title,
      status: 'success',
      postId: result.postId,
      link: result.link,
      seoScore: result.seoScore,
      keywords: finalKeywords,
      imageUrl: imageData?.url
    });

    // Save cluster state after successful post
    saveClusterStateAfterPost(userId, clusterContext, {
      title: postContent.title,
      link: result.link,
      postId: result.postId
    });

    console.log(`✅ Post published immediately: ${result.title} (SEO Score: ${result.seoScore}/100)${clusterContext ? ` [${clusterContext.mode.toUpperCase()}]` : ''}`);
    return result;
  } catch (error) {
    await addLog(userId, {
      title: 'Manual Post',
      status: 'failed',
      error: error.message
    });
    console.error(`❌ Manual post failed: ${error.message}`);
    throw error;
  }
}
