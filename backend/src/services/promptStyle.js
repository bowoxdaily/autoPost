// Shared writing-style guidance for all AI content providers.
// Keep title/readability rules here (single source) so each provider service
// does not duplicate them.

export function getLanguageInstruction(language) {
  return language === 'en'
    ? 'Write the entire output in English.'
    : 'Tulis seluruh output dalam Bahasa Indonesia.';
}

export function getFallbackTitle(topic, language) {
  return language === 'en'
    ? `How to Get ${topic} Right`
    : `Cara Tepat Memahami ${topic}`;
}

export function getTitleStyleRules(topic) {
  return `TITLE RULES (make it sound human, NOT AI):
- Natural and specific, like a real editor wrote it. Include "${topic}" naturally (it does NOT have to be the first word).
- AVOID these AI/clickbait clichés entirely: "Panduan Lengkap", "Ultimate", "Definitive", "Complete Guide", "Essential", "Proven", "Esensial", "Terbukti", "Rahasia", "Wajib".
- DO NOT stack a colon plus 2-3 comma-separated buzzwords (avoid "X: Strategi, Tips, dan Pertumbuhan").
- One clear idea per title. Sound like something a person would actually click.
- NO dates (no 2024, 2025, 3/31, etc) and NO "Latest", "New", "Updated".
- Good (ID): "Cara Menyusun Strategi Pemasaran yang Benar-benar Jalan"
- Avoid (ID): "Panduan Lengkap: Strategi, Pemasaran, dan Pertumbuhan"
- Keep it 50-60 characters and timeless (should still rank in 2+ years).`;
}

export function getReadabilityRules() {
  return `CONTENT READABILITY RULES (easy to read):
- Short paragraphs (2-3 sentences each). No walls of text.
- Short, clear sentences. Use simple everyday words; explain any jargon.
- Conversational and direct. Address the reader as "Anda".
- Vary sentence length and openings so it reads human, not templated.
- AVOID filler/AI transitions: "Selain itu", "Selanjutnya", "Pada akhirnya", "Di era digital ini", "Dalam dunia yang serba cepat", "Tidak dapat dipungkiri", "Penting untuk dicatat".
- Give concrete, practical tips with real examples - no generic fluff.`;
}
