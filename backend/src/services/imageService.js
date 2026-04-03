import axios from 'axios';

/**
 * Fetch image using Loremflickr - generates random professional images
 * Truly free, no API key needed
 * @param {string} query - Image search query (used as tags)
 * @returns {Promise<Object>} Image data with URLs
 */
export async function fetchImageFromUnsplash(query) {
  try {
    // Loremflickr: Free random image service based on tags
    // Format: https://loremflickr.com/WIDTH/HEIGHT/TAGS
    // No authentication needed!
    
    const tags = query
      .split(' ')
      .slice(0, 2) // Use first 2 words as tags
      .join(',')
      .toLowerCase()
      .replace(/[^a-z0-9,]/g, '');
    
    const imageUrl = `https://loremflickr.com/1280/720/${tags}`;
    
    console.log(`🖼️  [Image] Fetching image for: "${query}" (tags: ${tags})`);
    
    // Verify image is accessible
    const response = await axios.head(imageUrl, { timeout: 5000 });
    
    if (response.status === 200) {
      console.log(`✅ [Image] Image ready: ${imageUrl}`);
      
      return {
        url: imageUrl,
        downloadUrl: imageUrl,
        credit: 'LoremFlickr - Free stock images',
        alt: query,
        width: 1280,
        height: 720
      };
    }
    
    throw new Error('Image not accessible');
  } catch (error) {
    console.error(`❌ [Image] Loremflickr error: ${error.message}`);
    
    // Fallback to completely generic business image
    try {
      return await getGenericFallbackImage();
    } catch (fallbackError) {
      console.error(`⚠️  [Image] Fallback also failed: ${fallbackError.message}`);
      return null;
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
    
    // Use a reliable generic business image
    // This is a truly public, always-available image
    const imageUrl = 'https://via.placeholder.com/1280x720/4a5568/ffffff?text=Business+Article';
    
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
  try {
    console.log(`📥 [Image] Downloading image from: ${imageUrl}`);
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    console.log(`✅ [Image] Image downloaded (${response.data.length} bytes)`);
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`❌ [Image] Download error: ${error.message}`);
    throw error;
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

