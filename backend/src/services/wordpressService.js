import axios from 'axios';
import { Buffer } from 'buffer';

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3); // avoid too-short noise words
}

function normalizeSlugOrName(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function sanitizeSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const CATEGORY_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'about', 'your', 'you', 'how', 'what', 'why',
  'best', 'guide', 'tips', 'complete', 'ultimate', 'essential', 'proven', 'new', 'latest',
  'dan', 'yang', 'untuk', 'dengan', 'dari', 'dalam', 'pada', 'agar', 'atau', 'juga', 'ini', 'itu',
  'cara', 'panduan', 'tips', 'terbaik', 'lengkap', 'baru', 'terbaru'
]);

function meaningfulTokens(text) {
  return tokenize(text).filter(t => !CATEGORY_STOPWORDS.has(t));
}

const TAG_STOPWORDS = new Set([
  // English
  'the', 'and', 'for', 'with', 'from', 'into', 'about', 'your', 'you', 'how', 'what', 'why',
  'best', 'guide', 'tips', 'complete', 'ultimate', 'essential', 'proven', 'new', 'latest',
  'strategy', 'strategies', 'business', 'marketing', 'article', 'blog', 'post',
  // Indonesian
  'dan', 'yang', 'untuk', 'dengan', 'dari', 'dalam', 'pada', 'agar', 'atau', 'juga', 'ini', 'itu',
  'cara', 'panduan', 'tips', 'terbaik', 'lengkap', 'baru', 'terbaru', 'artikel', 'postingan'
]);

function isMeaningfulTagKeyword(keyword) {
  const cleaned = String(keyword || '').trim();
  if (!cleaned) return false;

  // Keep multi-word phrases as long as they contain at least one non-stopword token.
  const parts = tokenize(cleaned);
  if (parts.length === 0) return false;
  if (parts.length === 1) {
    return !TAG_STOPWORDS.has(parts[0]) && parts[0].length >= 3;
  }

  return parts.some(part => !TAG_STOPWORDS.has(part));
}

async function fetchAllCategories(wpUrl, auth, { perPage = 100, maxPages = 10 } = {}) {
  const cleanUrl = wpUrl.replace(/\/$/, '');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };

  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await axios.get(`${cleanUrl}/wp-json/wp/v2/categories`, {
      headers,
      params: { per_page: perPage, page },
      timeout: 15000
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      all.push(...res.data);
    }

    if (!Array.isArray(res.data) || res.data.length < perPage) break;
  }
  return all;
}

async function findTagByName(wpUrl, auth, name) {
  const cleanUrl = wpUrl.replace(/\/$/, '');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };

  const res = await axios.get(`${cleanUrl}/wp-json/wp/v2/tags`, {
    headers,
    params: { search: name, per_page: 100 },
    timeout: 15000
  });

  const normalizedTarget = normalizeSlugOrName(name);
  const exact = (Array.isArray(res.data) ? res.data : []).find(tag => {
    const nameNorm = normalizeSlugOrName(tag?.name || '');
    const slugNorm = normalizeSlugOrName(tag?.slug || '');
    return nameNorm === normalizedTarget || slugNorm === normalizedTarget;
  });

  return exact || null;
}

async function createTag(wpUrl, auth, name) {
  const cleanUrl = wpUrl.replace(/\/$/, '');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };

  const res = await axios.post(`${cleanUrl}/wp-json/wp/v2/tags`, {
    name: String(name || '').trim(),
    slug: sanitizeSlug(name)
  }, {
    headers,
    timeout: 15000
  });

  return res.data;
}

function extractExistingTermId(error) {
  const code = error?.response?.data?.code;
  const termId = error?.response?.data?.data?.term_id;
  if (code === 'term_exists' && Number.isFinite(Number(termId))) {
    return Number(termId);
  }
  return null;
}

async function resolveTagIdsFromKeywords(wpUrl, auth, keywords = [], { title = '', metaDescription = '' } = {}) {
  const MAX_TAGS = 5;
  const contextTokens = new Set([
    ...tokenize(title),
    ...tokenize(metaDescription)
  ]);

  const normalizedKeywords = [...new Set(
    (Array.isArray(keywords) ? keywords : [])
      .map(k => String(k || '').trim())
      .filter(Boolean)
  )]
    .filter(isMeaningfulTagKeyword)
    .map(keyword => {
      const keywordTokens = tokenize(keyword);
      const overlap = keywordTokens.filter(t => contextTokens.has(t)).length;
      const phraseInTitle = normalizeSlugOrName(title).includes(normalizeSlugOrName(keyword)) ? 1 : 0;
      const score = overlap * 3 + phraseInTitle * 2;
      return { keyword, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.keyword)
    .slice(0, MAX_TAGS);

  const tagIds = [];

  for (const keyword of normalizedKeywords) {
    try {
      const existing = await findTagByName(wpUrl, auth, keyword);
      if (existing?.id) {
        tagIds.push(existing.id);
        continue;
      }

      const created = await createTag(wpUrl, auth, keyword);
      if (created?.id) {
        tagIds.push(created.id);
      }
    } catch (tagError) {
      const existingTermId = extractExistingTermId(tagError);
      if (existingTermId) {
        tagIds.push(existingTermId);
        continue;
      }

      // WP may return conflict if a similar tag exists; recover by searching again.
      if (tagError?.response?.status === 400 || tagError?.response?.status === 409) {
        try {
          const fallback = await findTagByName(wpUrl, auth, keyword);
          if (fallback?.id) {
            tagIds.push(fallback.id);
            continue;
          }
        } catch (_) {
          // Ignore and continue with other tags.
        }
      }

      console.warn(`⚠️  [WordPress] Tag skipped (${keyword}): ${tagError.response?.data?.message || tagError.message}`);
    }
  }

  // Fallback: if phrase-based tagging yields nothing, try token-based tags.
  if (tagIds.length === 0) {
    const tokenFallback = [...new Set(
      normalizedKeywords
        .flatMap(k => tokenize(k))
        .filter(t => t.length >= 4 && !TAG_STOPWORDS.has(t))
    )].slice(0, MAX_TAGS);

    for (const token of tokenFallback) {
      try {
        const existing = await findTagByName(wpUrl, auth, token);
        if (existing?.id) {
          tagIds.push(existing.id);
          continue;
        }

        const created = await createTag(wpUrl, auth, token);
        if (created?.id) {
          tagIds.push(created.id);
        }
      } catch (tagError) {
        const existingTermId = extractExistingTermId(tagError);
        if (existingTermId) {
          tagIds.push(existingTermId);
          continue;
        }
      }

      if (tagIds.length >= MAX_TAGS) break;
    }
  }

  return [...new Set(tagIds)].slice(0, MAX_TAGS);
}

function pickBestCategoryFromExisting({ categories, keywords = [], title = '', metaDescription = '', topic = '' }) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  const uncategorized =
    categories.find(c => String(c.slug || '').toLowerCase() === 'uncategorized') ||
    categories.find(c => String(c.name || '').toLowerCase() === 'uncategorized') ||
    null;

  const keywordPhrases = (Array.isArray(keywords) && keywords.length > 0 ? keywords : [])
    .map(k => String(k || '').trim())
    .filter(Boolean);

  const titleTokens = meaningfulTokens(title);
  const metaTokens = meaningfulTokens(metaDescription);
  const topicTokens = meaningfulTokens(topic);
  const allTokens = new Set([
    ...titleTokens,
    ...metaTokens,
    ...topicTokens,
    ...keywordPhrases.flatMap(p => meaningfulTokens(p))
  ]);

  let best = null;
  let bestScore = 0;

  for (const c of categories) {
    const name = String(c.name || '');
    const slug = String(c.slug || '');
    const description = String(c.description || '');

    const haystackNorm = normalizeSlugOrName(`${name} ${slug} ${description}`);
    const hayTokens = new Set(meaningfulTokens(haystackNorm));

    let score = 0;

    // Phrase match (e.g., "email marketing")
    for (const phrase of keywordPhrases) {
      const phraseNorm = normalizeSlugOrName(phrase);
      if (!phraseNorm) continue;

      if (haystackNorm.includes(phraseNorm)) score += 8;
    }

    // Topic should dominate category choice so it doesn't always stick to a broad category.
    for (const t of topicTokens) {
      if (hayTokens.has(t)) score += 6;
    }

    // Token overlap (e.g., "seo", "marketing")
    let overlap = 0;
    for (const t of allTokens) {
      if (hayTokens.has(t)) overlap++;
    }
    score += overlap * 2;

    if (!best || score > bestScore) {
      best = c;
      bestScore = score;
    }
  }

  // Require at least some relevance; otherwise fallback to first non-uncategorized if available.
  if (best && bestScore > 0) return best;
  const firstNonUncategorized = categories.find(c => {
    const slug = String(c.slug || '').toLowerCase();
    const name = String(c.name || '').toLowerCase();
    return slug !== 'uncategorized' && name !== 'uncategorized';
  });
  return firstNonUncategorized || uncategorized || categories[0] || null;
}

export async function postToWordPress(wpUrl, wpUser, wpPass, title, content, metaDescription = '', seoData = {}) {
  try {
    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
    
    const url = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;

    // Prepare post data
    const postData = {
      title,
      content,
      status: 'publish'
    };

    // Add excerpt (meta description) if provided
    if (metaDescription) {
      postData.excerpt = metaDescription;
    }
    if (seoData?.slug) {
      const cleanSlug = sanitizeSlug(seoData.slug);
      if (cleanSlug) postData.slug = cleanSlug;
    }

    // Pick the most relevant *existing* WordPress category and assign it to the post
    try {
      const keywords = Array.isArray(seoData.keywords) ? seoData.keywords : [];
      const categories = await fetchAllCategories(wpUrl, auth);
      const bestCategory = pickBestCategoryFromExisting({
        categories,
        keywords,
        title,
        metaDescription,
        topic: seoData.topic || ''
      });

      if (bestCategory?.id) {
        postData.categories = [bestCategory.id];
      }
    } catch (categoryError) {
      console.warn(`⚠️  [WordPress] Category selection skipped: ${categoryError.response?.data?.message || categoryError.message}`);
      // Continue without category to avoid blocking post creation
    }

    // Resolve/create tags from SEO keywords and attach them to the post
    try {
      const tagIds = await resolveTagIdsFromKeywords(wpUrl, auth, seoData.keywords || [], {
        title,
        metaDescription
      });
      if (tagIds.length > 0) {
        postData.tags = tagIds;
      }
    } catch (tagResolveError) {
      console.warn(`⚠️  [WordPress] Tag assignment skipped: ${tagResolveError.response?.data?.message || tagResolveError.message}`);
      // Continue without tags to avoid blocking post creation
    }

    // Add SEO fields via meta if supported by theme/plugin
    if (seoData.seoScore !== undefined) {
      postData.meta = {
        seo_score: seoData.seoScore,
        focus_keyword: seoData.keywords?.[0] || ''
      };
    }

    const response = await axios.post(
      url,
      postData,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      postId: response.data.id,
      link: response.data.link,
      title: response.data.title.rendered,
      seoScore: seoData.seoScore || 0,
      keywords: seoData.keywords || []
    };
  } catch (error) {
    throw new Error(`Failed to post to WordPress: ${error.response?.data?.message || error.message}`);
  }
}

export async function verifyWordPressConnection(wpUrl, wpUser, wpPass) {
  try {
    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
    const cleanUrl = wpUrl.replace(/\/$/, '');
    const url = `${cleanUrl}/wp-json/wp/v2/users/me`;

    console.log(`[WordPress] Testing connection to: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`[WordPress] ✅ Connection successful for user: ${response.data.name}`);
    return { success: true };
  } catch (error) {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    
    let hint = '';
    if (status === 401) {
      hint = '\n\nPossible issues:\n' +
             '• WordPress username is incorrect\n' +
             '• WordPress App Password is incorrect\n' +
             '• REST API is disabled\n' +
             '• User does not have permissions';
    } else if (status === 404) {
      hint = '\n\nPossible issues:\n' +
             '• WordPress URL is incorrect\n' +
             '• WordPress is not installed\n' +
             '• REST API is not enabled (v5.0+)';
    } else if (status === 0 || error.code === 'ECONNREFUSED') {
      hint = '\n\nPossible issues:\n' +
             '• WordPress server is not running\n' +
             '• WordPress URL is unreachable\n' +
             '• Network connection problem';
    }

    console.error(`[WordPress] ❌ Connection failed (${status}): ${statusText}`);
    throw new Error(`Invalid WordPress credentials (HTTP ${status}): Please verify your WordPress URL, username, and app password.${hint}`);
  }
}

/**
 * Upload image to WordPress media library
 * @param {string} wpUrl - WordPress site URL
 * @param {string} wpUser - WordPress username
 * @param {string} wpPass - WordPress password
 * @param {Buffer} imageBuffer - Image binary data
 * @param {string} filename - Image filename
 * @param {string} alt - Alt text for image
 * @returns {Promise<Object>} Media object with ID and URLs
 */
export async function uploadImageToWordPress(wpUrl, wpUser, wpPass, imageBuffer, filename, alt = '') {
  try {
    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
    const cleanUrl = wpUrl.replace(/\/$/, '');
    const url = `${cleanUrl}/wp-json/wp/v2/media`;

    console.log(`📤 [WordPress] Uploading image: ${filename}`);

    const response = await axios.post(url, imageBuffer, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'image/jpeg'
      },
      timeout: 30000
    });

    const mediaId = response.data.id;
    console.log(`✅ [WordPress] Image uploaded (Media ID: ${mediaId})`);

    // Update alt text if provided
    if (alt) {
      try {
        await axios.post(
          `${cleanUrl}/wp-json/wp/v2/media/${mediaId}`,
          { alt_text: alt },
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`✅ [WordPress] Alt text added to image`);
      } catch (altError) {
        console.log(`⚠️  [WordPress] Could not set alt text: ${altError.message}`);
      }
    }

    return {
      id: mediaId,
      url: response.data.source_url,
      alt: alt || filename
    };
  } catch (error) {
    console.error(`❌ [WordPress] Image upload failed: ${error.message}`);
    throw new Error(`Failed to upload image to WordPress: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Set featured image for a post
 * @param {string} wpUrl - WordPress site URL
 * @param {string} wpUser - WordPress username
 * @param {string} wpPass - WordPress password
 * @param {number} postId - Post ID
 * @param {number} mediaId - Media ID of the image
 * @returns {Promise<void>}
 */
export async function setFeaturedImageForPost(wpUrl, wpUser, wpPass, postId, mediaId) {
  try {
    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
    const cleanUrl = wpUrl.replace(/\/$/, '');
    const url = `${cleanUrl}/wp-json/wp/v2/posts/${postId}`;

    console.log(`🖼️  [WordPress] Setting featured image (Media ID: ${mediaId}) for post ${postId}`);

    await axios.post(url, { featured_media: mediaId }, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`✅ [WordPress] Featured image set successfully`);
  } catch (error) {
    console.error(`❌ [WordPress] Failed to set featured image: ${error.message}`);
    throw new Error(`Failed to set featured image: ${error.response?.data?.message || error.message}`);
  }
}
