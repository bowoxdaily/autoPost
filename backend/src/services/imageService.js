import axios from 'axios';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractMeaningfulTags(query) {
  const stopwords = new Set([
    'professional', 'business', 'guide', 'tips', 'best', 'how', 'complete',
    'article', 'strategy', 'strategies', 'panduan', 'terbaik', 'cara', 'untuk'
  ]);

  const words = String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(Boolean)
    .filter(w => w.length >= 3)
    .filter(w => !stopwords.has(w));

  // Keep up to 4 meaningful terms for better relevance.
  const unique = [...new Set(words)].slice(0, 4);

  // If query becomes too generic/empty, fallback to stable business terms.
  if (unique.length === 0) return ['technology', 'finance'];
  return unique;
}

/**
 * Fetch a topic-relevant image that varies per post.
 * Order: official Unsplash API (if key set) -> LoremFlickr (free) -> Picsum.
 * @param {string} query - Image search query (used as tags)
 * @returns {Promise<Object>} Image data with URLs
 */
export async function fetchImageFromUnsplash(query) {
  const cleanQuery = String(query || '').trim() || 'business';

  // 1) Official Unsplash API (best relevance) when an access key is configured.
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      const res = await axios.get('https://api.unsplash.com/photos/random', {
        params: {
          query: cleanQuery,
          orientation: 'landscape',
          content_filter: 'high'
        },
        headers: { Authorization: `Client-ID ${unsplashKey}` },
        timeout: 15000
      });

      const url = res?.data?.urls?.regular || res?.data?.urls?.full;
      if (url) {
        console.log(`✅ [Image] Unsplash API image selected for: "${cleanQuery}"`);
        return {
          url,
          downloadUrl: url,
          credit: `Unsplash - ${res.data?.user?.name || 'Unknown'}`.trim(),
          alt: cleanQuery,
          width: 1280,
          height: 720
        };
      }
    } catch (error) {
      console.warn(`⚠️  [Image] Unsplash API failed, falling back: ${error.message}`);
    }
  }

  // 2) Free, no key: Picsum with a per-post seed so every post gets a
  //    genuinely different, reliable image. (source.unsplash.com and
  //    loremflickr.com are both dead now — they return one identical image
  //    for every request, which is why all featured images looked the same.)
  try {
    const seed = `${extractMeaningfulTags(cleanQuery).join('-') || 'post'}-${Math.floor(Math.random() * 1_000_000)}`;
    const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1280/720`;

    console.log(`🖼️  [Image] Picsum (seed: ${seed})`);

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5
    });

    if (response.data && response.data.byteLength > 5000) {
      console.log(`✅ [Image] Picsum image accessible`);
      return {
        url: imageUrl,
        downloadUrl: imageUrl,
        credit: 'Picsum - Free stock images',
        alt: cleanQuery,
        width: 1280,
        height: 720
      };
    }

    throw new Error('Picsum returned empty/invalid image');
  } catch (error) {
    console.error(`❌ [Image] Picsum error: ${error.message}`);
    return await getGenericFallbackImage();
  }
}

/**
 * Get a completely generic business image as last resort fallback
 * Uses a public, free image URL that always works
 * @returns {Promise<Object>} Fallback image data
 */
export async function getGenericFallbackImage() {
  try {
    console.log(`🖼️  [Image] Using generic business image fallback`);

    // Seeded Picsum so even the last-resort image differs between posts.
    const seed = Math.floor(Math.random() * 1_000_000);
    const imageUrl = `https://picsum.photos/seed/${seed}/1280/720`;

    console.log(`✅ [Image] Using placeholder image: ${imageUrl}`);

    return {
      url: imageUrl,
      downloadUrl: imageUrl,
      credit: 'Placeholder image',
      alt: 'Business article image',
      width: 1280,
      height: 720
    };
  } catch (error) {
    console.error(`❌ [Image] All image sources failed: ${error.message}`);
    return null;
  }
}

/**
 * Download image file and get binary data
 * Used for uploading to WordPress media library
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<Buffer>} Image binary data
 */
export async function downloadImageBuffer(imageUrl) {
  const maxAttempts = 3;
  const retryDelayMs = [700, 1500, 2500];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📥 [Image] Downloading image from: ${imageUrl} (attempt ${attempt}/${maxAttempts})`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxRedirects: 5
      });
      
      console.log(`✅ [Image] Image downloaded (${response.data.length} bytes)`);
      return Buffer.from(response.data);
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      const status = error.response?.status;
      console.warn(`⚠️  [Image] Download attempt ${attempt} failed${status ? ` (HTTP ${status})` : ''}: ${error.message}`);

      if (isLastAttempt) {
        console.error(`❌ [Image] Download error after ${maxAttempts} attempts: ${error.message}`);
        throw error;
      }

      await sleep(retryDelayMs[attempt - 1] || 1000);
    }
  }
}

/**
 * Get image filename from URL
 * @param {string} url - Image URL
 * @returns {string} Filename
 */
export function getImageFilename(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'post-image.jpg';
    
    // Ensure it has an extension
    if (!filename.includes('.') || filename.includes('?')) {
      return `post-image-${Date.now()}.jpg`;
    }
    
    return filename;
  } catch (error) {
    return `post-image-${Date.now()}.jpg`;
  }
}

