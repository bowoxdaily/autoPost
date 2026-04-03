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
 * Fetch image using Loremflickr - generates random professional images
 * Truly free, no API key needed
 * @param {string} query - Image search query (used as tags)
 * @returns {Promise<Object>} Image data with URLs
 */
export async function fetchImageFromUnsplash(query) {
  try {
    // Unsplash Source: no API key, but search-based (returns a random image matching the query)
    // Docs: https://source.unsplash.com/
    const encodedQuery = encodeURIComponent(String(query || '').trim() || 'business');
    const imageUrl = `https://source.unsplash.com/1280x720/?${encodedQuery}`;

    console.log(`🖼️  [Image] Fetching via Unsplash Source for: "${query}"`);

    // Download once to verify it's a real image (and to populate binary for WP upload via separate call)
    // Here we just verify accessibility quickly.
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5
    });

    if (response.data && response.data.byteLength > 10000) {
      console.log(`✅ [Image] Unsplash Source image accessible for query`);
      return {
        url: imageUrl,
        downloadUrl: imageUrl,
        credit: 'Unsplash Source',
        alt: query,
        width: 1280,
        height: 720
      };
    }

    throw new Error('Unsplash Source returned empty/invalid image');
  } catch (error) {
    console.error(`❌ [Image] Unsplash Source error: ${error.message}`);

    // Fallback to LoremFlickr (random) as last-optional provider
    try {
      const tags = extractMeaningfulTags(query).join(',');
      const imageUrl = `https://loremflickr.com/1280/720/${tags}`;

      console.log(`ℹ️  [Image] Fallback to LoremFlickr (tags: ${tags})`);

      const headRes = await axios.head(imageUrl, { timeout: 10000 });
      if (headRes.status === 200) {
        return {
          url: imageUrl,
          downloadUrl: imageUrl,
          credit: 'LoremFlickr - Free stock images',
          alt: query,
          width: 1280,
          height: 720
        };
      }
      throw new Error('LoremFlickr not accessible');
    } catch (fallbackError) {
      console.error(`⚠️  [Image] Fallback also failed: ${fallbackError.message}`);
      return await getGenericFallbackImage();
    }
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
    
    // Use Picsum as generic fallback (usually more stable than placeholder endpoints)
    const imageUrl = 'https://picsum.photos/1280/720';
    
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

