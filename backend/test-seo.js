// Test SEO-optimized content generation
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key dari environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ ERROR: GEMINI_API_KEY environment variable tidak di-set');
  process.exit(1);
}

console.log(`📌 Testing SEO Content Generation with gemini-2.5-flash\n`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testSEOGeneration() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Same prompt as geminiService.js
    const topic = 'Digital Marketing Strategy';
    const prompt = `Generate a SEO-optimized blog post about "${topic}". 

CRITICAL: NO DATES OR "LATEST" IN TITLE - Make it timeless for long-term ranking!

REQUIREMENTS FOR SEO PAGE 1 RANKING:
1. TITLE (50-60 chars, include keyword at start):
   - Use power words: How, Best, Complete, Guide, Tips, Proven
   - NO dates, NO "Latest" - must be TIMELESS
   - Example: "Best Digital Marketing Strategy: Complete Guide"

2. SLUG: URL-friendly slug without dates

3. META DESCRIPTION (150-160 chars):
   - Include keyword, NO dates

4. CONTENT (1500+ words):
   - Timeless, evergreen content
   - NO specific dates or "2024 trends"

Return ONLY valid JSON:
{
  "title": "SEO title without dates",
  "slug": "url-slug",
  "metaDescription": "Meta description",
  "content": "Full HTML content 1500+ words. TIMELESS, no dates.",
  "keywords": ["keyword1", "keyword2"],
  "seoScore": 85
}`;

    console.log(`🔄 Generating SEO content for: "${topic}"...\n`);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Try to parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ SUCCESS: SEO content generated!\n');
      console.log(`📝 Title: ${parsed.title}`);
      console.log(`📊 SEO Score: ${parsed.seoScore}/100`);
      console.log(`🔑 Keywords: ${parsed.keywords.join(', ')}`);
      console.log(`📄 Content length: ${parsed.content.length} chars (~${Math.round(parsed.content.length / 5)} words)`);
      console.log(`🔗 Slug: ${parsed.slug}`);
      console.log(`\n📌 Meta: ${parsed.metaDescription.substring(0, 80)}...`);
      return true;
    } else {
      console.log('⚠️  Raw response preview:');
      console.log(text.substring(0, 300) + '...');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testSEOGeneration().then(success => {
  process.exit(success ? 0 : 1);
});
