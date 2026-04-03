import axios from 'axios';
import { Buffer } from 'buffer';

/**
 * Get Yoast SEO data from a WordPress post
 * Yoast stores keyword and SEO data in post meta
 * @param {string} wpUrl - WordPress URL
 * @param {string} wpUser - WordPress username
 * @param {string} wpPass - WordPress password/app password
 * @param {number} postId - WordPress post ID
 * @returns {object} - Yoast SEO data (keywords, focus_keyword, readability_score, etc)
 */
export async function getYoastKeywords(wpUrl, wpUser, wpPass, postId) {
  try {
    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
    const cleanUrl = wpUrl.replace(/\/$/, '');
    
    // Fetch post with meta data to get Yoast fields
    const url = `${cleanUrl}/wp-json/wp/v2/posts/${postId}`;

    console.log(`[Yoast] Fetching Yoast data for post ${postId}...`);

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const post = response.data;
    const keywords = [];
    let yoastData = {
      keywords: [],
      focus_keyword: null,
      readability_score: null,
      seo_score: null
    };

    // Extract Yoast fields from post meta
    if (post.meta) {
      // Yoast stores focus keyword here
      if (post.meta._yoast_wpseo_focuskw) {
        yoastData.focus_keyword = post.meta._yoast_wpseo_focuskw;
        keywords.push(post.meta._yoast_wpseo_focuskw);
      }

      // Yoast metakeywords (legacy but sometimes used)
      if (post.meta._yoast_wpseo_metakeywords) {
        const metaKeywords = post.meta._yoast_wpseo_metakeywords.split(',').map(k => k.trim());
        keywords.push(...metaKeywords);
      }

      // Yoast readability score
      if (post.meta._yoast_wpseo_content_analysis) {
        yoastData.readability_score = post.meta._yoast_wpseo_content_analysis;
      }

      // Yoast SEO score
      if (post.meta._yoast_wpseo_linkdex) {
        yoastData.seo_score = post.meta._yoast_wpseo_linkdex;
      }
    }

    yoastData.keywords = [...new Set(keywords)]; // Remove duplicates

    console.log(`[Yoast] ✅ Found keywords:`, yoastData.keywords);
    return yoastData;
  } catch (error) {
    console.log(`[Yoast] ⚠️  Could not fetch Yoast data:`, error.message);
    // Return empty Yoast data - not fatal if Yoast is not installed
    return {
      keywords: [],
      focus_keyword: null,
      readability_score: null,
      seo_score: null
    };
  }
}

/**
 * Search for Yoast suggestion keywords from WordPress
 * Some Yoast versions store suggestion data
 * @param {string} wpUrl - WordPress URL
 * @param {string} wpUser - WordPress username
 * @param {string} wpPass - WordPress password/app password
 * @returns {array} - Keywords suggestions
 */
export async function getYoastSuggestions(wpUrl, wpUser, wpPass) {
  try {
    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
    const cleanUrl = wpUrl.replace(/\/$/, '');

    // Try to access Yoast suggestion endpoint (if available)
    const url = `${cleanUrl}/wp-json/yoast/v1/suggestions`;

    console.log(`[Yoast] Checking for keyword suggestions...`);

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log(`[Yoast] ✅ Found suggestions`);
    return response.data || [];
  } catch (error) {
    // This endpoint may not exist depending on Yoast version
    console.log(`[Yoast] ℹ️  No suggestion endpoint available (normal if using older Yoast)`);
    return [];
  }
}

/**
 * Check if Yoast SEO is installed and active
 * @param {string} wpUrl - WordPress URL
 * @param {string} wpUser - WordPress username
 * @param {string} wpPass - WordPress password/app password
 * @returns {boolean} - True if Yoast is detected
 */
export async function isYoastInstalled(wpUrl, wpUser, wpPass) {
  try {
    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
    const cleanUrl = wpUrl.replace(/\/$/, '');

    // Check for Yoast plugin via REST API
    const url = `${cleanUrl}/wp-json/yoast/v1/status`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log(`[Yoast] ✅ Yoast SEO plugin is installed and accessible`);
    return true;
  } catch (error) {
    // Yoast endpoint not found - plugin not installed or disabled
    console.log(`[Yoast] ℹ️  Yoast SEO plugin not detected on this site`);
    return false;
  }
}

export default {
  getYoastKeywords,
  getYoastSuggestions,
  isYoastInstalled
};
