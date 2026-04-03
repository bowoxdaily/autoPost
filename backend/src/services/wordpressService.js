import axios from 'axios';
import { Buffer } from 'buffer';

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

    // Note: Tags require IDs (not names) and would need separate API calls to create/lookup
    // Skipping tags to avoid conflicts. Can be added via WordPress UI or category instead.

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
