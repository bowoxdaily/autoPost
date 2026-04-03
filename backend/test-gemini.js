// Quick test untuk verify Gemini API Key
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key dari environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ ERROR: GEMINI_API_KEY environment variable tidak di-set');
  console.log('Set dengan: set GEMINI_API_KEY=your_api_key');
  process.exit(1);
}

console.log(`📌 Testing dengan API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(-5)}`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  
  console.log('\n🔄 Testing all Gemini models...\n');
  
  for (const modelName of models) {
    try {
      console.log(`  Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      console.log(`  ✅ SUCCESS: ${modelName} works!\n`);
      return true;
    } catch (error) {
      const errorMsg = error.message || error.toString();
      console.log(`  ❌ ${modelName}: ${errorMsg.split('\n')[0]}\n`);
    }
  }
  
  console.log('❌ SEMUA MODEL GAGAL!\n');
  console.log('Kemungkinan penyebab:');
  console.log('1. API Key salah atau expired');
  console.log('2. Quota/rate limit habis');
  console.log('3. Model tidak available di region Anda');
  console.log('4. No internet connection');
  console.log('\n👉 Buka https://aistudio.google.com/app/apikey untuk check status');
  return false;
}

testModels().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
