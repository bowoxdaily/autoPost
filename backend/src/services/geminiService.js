import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generatePostContent(apiKey, topic) {
  try {
    // Validate API key format
    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please configure it in User Credentials.');
    }
    
    if (apiKey.length < 20) {
      throw new Error('Invalid Gemini API key format. Please verify the key length and format.');
    }
    
    console.log(`🔑 [Gemini] Initializing with API key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try latest model first, fallback to alternatives
    let model;
    const modelsToTry = [
      'gemini-2.5-flash',      // Latest model (newest)
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
    
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 [Gemini] Testing model: ${modelName}...`);
        model = genAI.getGenerativeModel({ model: modelName });
        
        // Try a quick test to verify the model works
        const testResult = await model.generateContent('Test');
        console.log(`✅ [Gemini] Using model: ${modelName}`);
        break;
      } catch (testError) {
        lastError = testError;
        const errorMsg = testError.message || testError.toString();
        console.log(`⚠️  [Gemini] Model ${modelName} not available: ${errorMsg}`);
        
        // Check for specific error patterns
        if (errorMsg.includes('API key')) {
          throw new Error(`❌ Gemini API key is invalid or incorrect. Error: ${errorMsg}`);
        }
        if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
          throw new Error(`❌ API quota exceeded. Please check your Gemini API quota and billing. Error: ${errorMsg}`);
        }
        if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          throw new Error(`❌ Model not available in your region. Error: ${errorMsg}`);
        }
        if (errorMsg.includes('permission') || errorMsg.includes('403')) {
          throw new Error(`❌ Permission denied. Make sure your Gemini API has access enabled. Error: ${errorMsg}`);
        }
        continue;
      }
    }
    
    if (!model) {
      const errorDetails = lastError ? `Last error: ${lastError.message}` : 'Unknown error';
      throw new Error(`❌ No compatible Gemini model available. Tried models: ${modelsToTry.join(', ')}. ${errorDetails}. 
      
      💡 Solutions:
      1. Verify your Gemini API key is correct (User Credentials)
      2. Check your API quota at https://console.cloud.google.com
      3. Enable billing in your Google Cloud project
      4. Ensure API is enabled in: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com`);
    }

    const prompt = `Generate a SEO-optimized blog post about "${topic}". 

CRITICAL: NO DATES OR "LATEST" IN TITLE - Make it timeless for long-term ranking!

REQUIREMENTS FOR SEO PAGE 1 RANKING:
1. TITLE (50-60 chars, include keyword at start):
   - Use power words: How, Best, Complete, Guide, Tips, Proven, Essential, Definitive
   - Include "${topic}" naturally and early in title
   - NO dates (no 2024, 2025, 3/31, etc) - dates age content
   - NO "Latest", "New", "Updated" - not SEO-friendly
   - Example: "Best ${topic}: Complete Guide" or "How to Master ${topic}"
   - Make it TIMELESS - should rank well in 2+ years

2. SLUG: Generate URL-friendly slug (lowercase, hyphens)
   - Reflect the main keyword, no dates
   - Example: "best-digital-marketing-strategy" not "digital-marketing-2024"

3. META DESCRIPTION (150-160 chars):
   - Include keyword clearly at start
   - Include benefit/value proposition
   - Call to action
   - NO dates or "latest" keywords
   - Compelling, click-worthy

4. CONTENT (1500+ words):
   - Use H2 headers for main sections
   - Use H3 headers for subsections
   - Include target keyword in first 100 words
   - Keyword density 1-2%
   - Include actionable, proven tips
   - Add related topic suggestions
   - Write for readers, optimize for search
   - DO NOT reference specific dates or "latest trends" - focus on evergreen content
   - Use phrases like "current best practices" not "2024 trends"

5. IMAGE PROMPT:
   - Create a professional, descriptive image search query (5-10 words)
   - The query should visually represent the blog post topic
   - Use terms suitable for searching stock photo sites
   - Make it inspiring and professional
   - Example: "professional business team collaboration meeting"

6. STRUCTURE:
   - Introduction (200 words) - explain why this topic matters NOW and ALWAYS
   - 4-5 main sections with H2 headers
   - Each section 200+ words with practical insights
   - Conclusion with CTA (timeless, not date-based)
   - FAQ section (timeless questions)

Return ONLY valid JSON (no markdown):
{
  "title": "SEO-optimized title (50-60 chars, TIMELESS no dates)",
  "slug": "url-friendly-slug-no-dates",
  "metaDescription": "150-160 char description with keyword, no dates",
  "content": "Full HTML content with <h2>, <h3>, <p>, <strong>, <em> tags. Must be 1500+ words. TIMELESS content, no specific dates.",
  "imagePrompt": "professional business image search query",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "seoScore": 85-90
}

Make sure JSON is valid. Content must be actual 1500+ words.`;

    console.log(`📝 [Gemini] Generating SEO-optimized content for: ${topic}`);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse JSON from response - more robust extraction
    try {
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        // Try to fix common JSON issues
        // Remove any markdown code block markers
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Try parsing
        try {
          const parsed = JSON.parse(jsonStr);
          console.log(`✅ [Gemini] SEO Content generated: "${parsed.title}" (${parsed.seoScore}/100)`);
          
          // Ensure imagePrompt exists (fallback to topic-based)
          if (!parsed.imagePrompt) {
            parsed.imagePrompt = `professional ${topic.toLowerCase()} business illustration`;
          }
          
          return parsed;
        } catch (parseError) {
          console.log(`⚠️  [Gemini] JSON parse error: ${parseError.message}. Attempting to clean content...`);
          
          // Try to clean problematic characters in content field
          // Extract sections more carefully
          const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]+)"/);
          const slugMatch = jsonStr.match(/"slug"\s*:\s*"([^"]+)"/);
          const descMatch = jsonStr.match(/"metaDescription"\s*:\s*"([^"]+)"/);
          const scoreMatch = jsonStr.match(/"seoScore"\s*:\s*(\d+)/);
          const keywordsMatch = jsonStr.match(/"keywords"\s*:\s*\[(.*?)\]/);
          
          // Extract content more carefully using position-based approach
          let content = 'Unable to parse content';
          
          try {
            // Find "content": position
            const contentStartIdx = jsonStr.indexOf('"content"');
            // Find "keywords": position
            const keywordsStartIdx = jsonStr.indexOf('"keywords"');
            
            if (contentStartIdx !== -1 && keywordsStartIdx !== -1) {
              // Extract substring between "content": and "keywords":
              let contentSection = jsonStr.substring(contentStartIdx, keywordsStartIdx);
              
              // Find the opening quote after "content":
              const openQuoteIdx = contentSection.indexOf('"', '"content"'.length);
              // Find the last quote before "keywords" (this is tricky - need to find unescaped quote)
              
              // Use a better approach: find first " after "content": then find matching close "
              let inString = false;
              let escaped = false;
              let stringStart = -1;
              let stringEnd = -1;
              
              for (let i = '"content"'.length; i < contentSection.length; i++) {
                const char = contentSection[i];
                
                if (escaped) {
                  escaped = false;
                  continue;
                }
                
                if (char === '\\') {
                  escaped = true;
                  continue;
                }
                
                if (char === '"') {
                  if (!inString) {
                    inString = true;
                    stringStart = i + 1;
                  } else {
                    stringEnd = i;
                    break;
                  }
                }
              }
              
              if (stringStart !== -1 && stringEnd !== -1) {
                content = contentSection.substring(stringStart, stringEnd);
                // Unescape common escape sequences
                content = content
                  .replace(/\\n/g, '\n')
                  .replace(/\\t/g, '\t')
                  .replace(/\\"/g, '"')
                  .replace(/\\\//g, '/')
                  .replace(/\\\\/g, '\\');
              }
            }
          } catch (extractError) {
            console.log(`⚠️  [Gemini] Content extraction error: ${extractError.message}`);
            // Keep the fallback value
          }
          
          if (titleMatch) {
            console.log(`✅ [Gemini] Partially recovered content for: "${titleMatch[1]}"`);
            
            // Parse keywords array
            let keywords = [topic];
            if (keywordsMatch) {
              try {
                keywords = JSON.parse('[' + keywordsMatch[1] + ']');
              } catch (e) {
                keywords = keywordsMatch[1].split(',').map(k => k.trim().replace(/"/g, ''));
              }
            }
            
            return {
              title: titleMatch[1],
              slug: slugMatch ? slugMatch[1] : topic.toLowerCase().replace(/\s+/g, '-'),
              metaDescription: descMatch ? descMatch[1] : `Learn about ${topic}`,
              content: content,
              imagePrompt: `professional ${topic.toLowerCase()} business illustration`,
              keywords: keywords,
              seoScore: scoreMatch ? parseInt(scoreMatch[1]) : 75
            };
          }
          
          throw parseError;
        }
      }
    } catch (parseError) {
      console.log(`⚠️  [Gemini] Failed to parse JSON response: ${parseError.message}`);
      console.log(`📋 Raw response preview: ${text.substring(0, 200)}...`);
    }

    console.log(`⚠️  [Gemini] No valid JSON found, using fallback format`);
    return {
      title: `Best ${topic}: Complete Guide`,
      slug: topic.toLowerCase().replace(/\s+/g, '-'),
      metaDescription: `Discover the best practices for ${topic}. Complete guide with tips and strategies.`,
      content: text,
      imagePrompt: `professional ${topic.toLowerCase()} business illustration`,
      keywords: [topic],
      seoScore: 0
    };
  } catch (error) {
    console.error(`❌ [Gemini] Error: ${error.message}`);
    
    const errorMsg = error.message || error.toString();
    
    if (errorMsg.includes('API key') || errorMsg.includes('invalid')) {
      throw new Error(`❌ Gemini API Configuration Error: Invalid API key. 
      
Steps to fix:
1. Go to Dashboard → Account (top right)
2. Update your Gemini API key
3. Verify the key at: https://aistudio.google.com/apikey
4. Make sure to enable billing: https://console.cloud.google.com/billing`);
    }
    
    if (errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorMsg.includes('limit exceeded')) {
      throw new Error(`❌ API Quota Exceeded: Your Gemini API quota is exhausted.

Steps to fix:
1. Check your quota at: https://console.cloud.google.com/iam-admin/quotas
2. Review pricing: https://ai.google.dev/pricing
3. Enable billing if not already enabled
4. Request quota increase if needed`);
    }
    
    if (errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('No compatible')) {
      throw new Error(`❌ No Available Gemini Models: Unable to access any compatible model.

Steps to fix:
1. Verify model availability: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Ensure API is enabled
3. Check region availability
4. Try regenerating after a few minutes
5. Contact Google Cloud Support if issue persists`);
    }
    
    if (errorMsg.includes('permission') || errorMsg.includes('403')) {
      throw new Error(`❌ Permission Denied: Your API key doesn't have permission to access Gemini models.

Steps to fix:
1. Verify your API key has necessary permissions
2. Regenerate API key: https://aistudio.google.com/apikey
3. Update key in Dashboard → Account
4. Ensure your Google Cloud project has the API enabled`);
    }
    
    // Generic error with helpful debug info
    throw new Error(`❌ Failed to generate content: ${errorMsg}
    
This could be due to:
- Invalid API key (verify in Dashboard → Account)
- Quota exceeded (check https://console.cloud.google.com/iam-admin/quotas)
- No billing setup (enable at https://console.cloud.google.com/billing)
- API not enabled (enable at https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com)
- Connection issues (try again in a few moments)

Debug info: ${errorMsg}`);
  }
}
