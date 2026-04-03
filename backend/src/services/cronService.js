import cron from 'node-cron';
import { getSettings, getSettingsForUser, setCronActive, addLog } from '../utils/database.js';
import { generatePostContent } from './geminiService.js';
import { postToWordPress, uploadImageToWordPress, setFeaturedImageForPost } from './wordpressService.js';
import { getUserCredentialsForPosting } from './userCredentialsService.js';
import { getYoastKeywords } from './yoastService.js';
import { fetchImageFromUnsplash, downloadImageBuffer, getImageFilename } from './imageService.js';

let cronJob = null;
let currentUserId = null;

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
    
    // More SEO-friendly topics without dates (timeless content)
    const seoTopics = [
      'Digital Marketing Strategy',
      'Content Marketing Best Practices',
      'SEO Optimization Tips',
      'Social Media Marketing Guide',
      'Email Marketing Tactics',
      'Business Growth Strategies',
      'Productivity Tips for Remote Work',
      'Customer Engagement Techniques',
      'Brand Building Strategies',
      'Lead Generation Methods',
      'E-commerce Best Practices',
      'Mobile Marketing Trends',
      'Data Analytics for Business',
      'Conversion Rate Optimization',
      'User Experience Design'
    ];
    
    // Pick random topic for variety
    const topic = seoTopics[Math.floor(Math.random() * seoTopics.length)];
    
    const postContent = await generatePostContent(credentials.geminiKey, topic);
    
    // Extract SEO data from generated content
    const seoData = {
      seoScore: postContent.seoScore || 0,
      keywords: postContent.keywords || [topic]
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

    // Try to fetch and set featured image
    let imageData = null;
    try {
      const imagePrompt = postContent.imagePrompt || `professional ${topic.toLowerCase()} business illustration`;
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

    console.log(`✅ Post published: ${result.title} (SEO Score: ${result.seoScore}/100)`);
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
    
    // More SEO-friendly topics without dates (timeless content)
    const seoTopics = [
      'Digital Marketing Strategy',
      'Content Marketing Best Practices',
      'SEO Optimization Tips',
      'Social Media Marketing Guide',
      'Email Marketing Tactics',
      'Business Growth Strategies',
      'Productivity Tips for Remote Work',
      'Customer Engagement Techniques',
      'Brand Building Strategies',
      'Lead Generation Methods',
      'E-commerce Best Practices',
      'Mobile Marketing Trends',
      'Data Analytics for Business',
      'Conversion Rate Optimization',
      'User Experience Design'
    ];
    
    // Pick random topic for variety
    const topic = seoTopics[Math.floor(Math.random() * seoTopics.length)];
    
    const postContent = await generatePostContent(credentials.geminiKey, topic);
    
    // Extract SEO data from generated content
    const seoData = {
      seoScore: postContent.seoScore || 0,
      keywords: postContent.keywords || [topic]
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

    // Try to fetch and set featured image
    let imageData = null;
    try {
      const imagePrompt = postContent.imagePrompt || `professional ${topic.toLowerCase()} business illustration`;
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

    console.log(`✅ Post published immediately: ${result.title} (SEO Score: ${result.seoScore}/100)`);
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
