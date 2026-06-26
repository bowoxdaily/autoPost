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
    ? `What Actually Works for ${topic}`
    : `Yang Sebenarnya Berhasil dalam ${topic}`;
}

export function getTitleStyleRules(topic) {
  return `TITLE RULES — Sound like a HUMAN writer, NOT an AI:
- Write like a journalist or experienced blogger, NOT like a content farm.
- Include "${topic}" naturally — it does NOT have to be the first word.
- The title should feel like something you'd say out loud. Specific, not generic.
- STRICTLY FORBIDDEN (these scream AI): "Panduan Lengkap", "Ultimate Guide", "Definitive", "Complete Guide", "Essential", "Proven", "Esensial", "Terbukti", "Rahasia", "Wajib Tahu", "Master", "Comprehensive", "In-Depth".
- NO colon + buzzword lists. Avoid: "X: Strategi, Tips, dan Pertumbuhan Bisnis Anda".
- NO dates, NO "Terbaru", NO "Latest", NO "2024/2025".
- One clear idea. Direct. Reads like a confident human wrote it.
- Good (ID): "Kenapa Strategi Konten Anda Tidak Menghasilkan (dan Cara Memperbaikinya)"
- Good (EN): "Why Your Content Strategy Isn't Working — And What to Do Instead"
- Avoid (ID): "Panduan Lengkap: Strategi Pemasaran Digital Terbaik dan Terbukti"
- Keep 50-60 characters. Timeless — should rank for 2+ years.`;
}

export function getReadabilityRules() {
  return `HUMAN WRITING RULES — This content must NOT sound like AI:

SENTENCE RHYTHM:
- Mix short punchy sentences with occasional longer ones. "That's it." works. So does a three-clause sentence that builds naturally.
- Never start 3 consecutive sentences the same way.
- Use real contractions when appropriate (won't, it's, you'll, that's).
- Vary paragraph length. Not all paragraphs need 3 sentences.

VOICE & PERSONALITY:
- Have an actual opinion. Don't just list facts — say what you think is most important and why.
- It's OK to disagree with common advice if there's a good reason.
- Use hedging naturally: "In most cases", "This depends on", "Honestly, this varies", "Not always, but usually".
- Occasionally use first-person phrases like "The thing is", "Here's what most people miss", "In practice", "What's often overlooked".

STRICTLY BANNED — These phrases will make it sound like AI:
- ID: "Selain itu", "Selanjutnya", "Pada akhirnya", "Di era digital ini", "Dalam dunia yang terus berkembang", "Dalam dunia yang serba cepat", "Tidak dapat dipungkiri", "Penting untuk dicatat", "Perlu diketahui bahwa", "Hal ini sangat penting", "Dengan demikian", "Sebagai kesimpulan", "Secara keseluruhan", "Di sisi lain", "Lebih lanjut", "Oleh karena itu".
- EN: "In today's fast-paced world", "It's important to note", "It goes without saying", "In conclusion", "To summarize", "Furthermore", "Moreover", "Additionally", "It is worth mentioning", "In the realm of", "Leverage", "Unlock the potential", "Delve into", "Navigate", "In this comprehensive guide", "Look no further".

STRUCTURE VARIETY:
- Not every section needs to start with a header followed by a long paragraph. Mix it up.
- Some sections can open with a short statement, then expand.
- Use real examples: "For instance, when a client..." or "A concrete example: imagine you're...".
- Lists should feel organic — don't always use 5-point lists. Use 3, or 4, or 7 if that's what fits.
- Add a casual "by the way" type sentence occasionally to break monotony.

PARAGRAPH OPENERS — Rotate these, never repeat the same opener in a row:
- Start with a question: "So what actually happens when...?"
- Start with a fact: "Most businesses skip this step."
- Start with a short statement: "The real issue is simpler than it looks."
- Start mid-thought: "Think about it this way."
- Start with contrast: "Unlike what most guides say..."

ADDRESS READER DIRECTLY:
- ID: Use "Anda" naturally but not in every sentence. 
- EN: Use "you" naturally.
- Avoid over-formality. Write like you're explaining to a smart colleague over coffee.

Give concrete, practical tips with real (or realistic) examples. No generic fluff. No repetition.`;
}

/**
 * Returns the full anti-AI system persona message for chat-based providers.
 * @param {string} language - 'id' or 'en'
 */
export function getSystemPersona(language) {
  if (language === 'en') {
    return `You are a senior blog writer with 10+ years of experience writing for top publications. You write in a natural, opinionated, human style. Your content passes AI detection tools because it genuinely sounds human: varied rhythm, real opinions, natural imperfections, and concrete examples. You never use AI-sounding filler phrases. You always return clean JSON as instructed.`;
  }
  return `Kamu adalah penulis blog senior dengan pengalaman 10+ tahun menulis untuk media terkemuka. Kamu menulis dengan gaya yang alami, berpendapat, dan manusiawi. Kontenmu lolos dari AI detection tools karena memang terdengar seperti ditulis manusia: ritme bervariasi, opini nyata, ketidaksempurnaan alami, dan contoh konkret. Kamu tidak pernah menggunakan frasa pengisi bernuansa AI. Kamu selalu mengembalikan JSON bersih sesuai instruksi.`;
}

// ─── TOPIC CLUSTER ────────────────────────────────────────────────────────────

/** Number of supporting articles to generate per pillar before starting a new cycle */
export const CLUSTER_MAX_SUPPORTING = 4;

/**
 * Prompt section for PILLAR articles (broad hub, comprehensive overview).
 * @param {string} niche
 * @param {string} language
 */
export function getPillarPromptSection(niche, language) {
  if (language === 'en') {
    return `━━━ TOPIC CLUSTER: YOUR ROLE = PILLAR ARTICLE ━━━
This is the HUB article for the "${niche}" niche. It must:
- Be a comprehensive, authoritative OVERVIEW — the article people bookmark and share
- Cover ALL major sub-aspects as H2 sections (at least 4-5 H2s)
- Each H2 introduces a sub-topic with 150-200 words — enough to be useful, but leaves room for deeper supporting articles on each sub-topic
- Be 2000+ words total
- Target the broad head keyword for this niche (not a long-tail)
- Naturally hint at the existence of deeper guides: e.g. "We'll cover this in detail in a dedicated guide"
- Do NOT go too deep on any single sub-topic — breadth over depth here`;
  }
  return `━━━ TOPIC CLUSTER: PERANMU = ARTIKEL PILAR (PILLAR) ━━━
Ini adalah artikel HUB untuk niche "${niche}". Artikel ini harus:
- Menjadi gambaran umum yang komprehensif dan otoritatif — artikel yang orang bookmark dan share
- Mencakup SEMUA sub-aspek penting sebagai H2 section (minimal 4-5 H2)
- Setiap H2 mengenalkan sub-topik dengan 150-200 kata — cukup bermanfaat, tapi memberi ruang untuk artikel pendukung yang lebih mendalam per sub-topik
- Total minimal 2000 kata
- Menargetkan keyword utama (head keyword) dari niche ini, bukan long-tail
- Secara alami singgung keberadaan panduan lebih mendalam: misal "Kita akan bahas ini lebih detail di panduan khusus"
- JANGAN terlalu mendalam pada satu sub-topik — utamakan breadth (keluasan), bukan depth (kedalaman)`;
}

/**
 * Prompt section for SUPPORTING articles (deep-dive on one specific sub-topic).
 * @param {string} niche
 * @param {string} pillarTitle
 * @param {string} pillarUrl
 * @param {number} supportingIndex - 0-based index for angle variation
 * @param {string} language
 */
export function getSupportingPromptSection(niche, pillarTitle, pillarUrl, supportingIndex, language) {
  // Rotate angles so each supporting article covers a different aspect
  const anglesId = [
    'kesalahan paling umum yang dilakukan pemula (dan cara menghindarinya)',
    'panduan langkah demi langkah yang paling bisa langsung dipraktikkan hari ini',
    'aspek yang paling sering disalahpahami atau pertanyaan yang paling sering muncul',
    'teknik atau strategi lanjutan untuk yang sudah punya pengalaman dasar'
  ];
  const anglesEn = [
    'most common beginner mistakes (and how to avoid them)',
    'the most actionable step-by-step guide you can apply today',
    'the most misunderstood aspect or the most frequently asked question',
    'advanced technique or strategy for readers with some experience'
  ];
  const angle = language === 'en'
    ? anglesEn[supportingIndex % anglesEn.length]
    : anglesId[supportingIndex % anglesId.length];

  if (language === 'en') {
    return `━━━ TOPIC CLUSTER: YOUR ROLE = SUPPORTING ARTICLE #${supportingIndex + 1} ━━━
The pillar article "${pillarTitle}" already covers "${niche}" broadly at: ${pillarUrl}

Your task: write a FOCUSED DEEP-DIVE on ONE specific sub-topic.

ANGLE FOR THIS ARTICLE: "${angle}" within "${niche}".

Rules:
- Pick ONE specific angle — do NOT write another broad overview
- Title must clearly reflect the specific sub-topic (long-tail keyword), NOT the broad niche
- Go MUCH deeper than the pillar on this specific aspect
- 1500+ words, tightly focused on the sub-topic
- MANDATORY INTERNAL LINK: Somewhere natural in the content, include:
  <a href="${pillarUrl}">${pillarTitle}</a>
  → Place it in a sentence that flows naturally (e.g. "As we covered in our overview of ${niche}...")
  → NOT as a footer footnote. NOT bolted on at the end. NATURALLY woven in.
- Good title example: if niche is "MPASI" and angle is beginner mistakes → "5 MPASI Mistakes New Parents Make (And What to Do Instead)"`;
  }

  return `━━━ TOPIC CLUSTER: PERANMU = ARTIKEL PENDUKUNG #${supportingIndex + 1} ━━━
Artikel pilar "${pillarTitle}" sudah membahas "${niche}" secara umum di: ${pillarUrl}

Tugasmu: tulis DEEP-DIVE yang FOKUS pada SATU sub-topik spesifik.

SUDUT PANDANG ARTIKEL INI: "${angle}" dalam topik "${niche}".

Aturan:
- Pilih SATU sudut pandang spesifik — JANGAN tulis gambaran umum lagi
- Judul harus mencerminkan sub-topik spesifik tersebut (long-tail keyword), BUKAN niche secara umum
- Jauh LEBIH MENDALAM dari artikel pilar pada aspek spesifik ini
- Minimal 1500 kata, fokus ketat pada sub-topik
- INTERNAL LINK WAJIB: Di suatu tempat yang alami dalam konten, sertakan:
  <a href="${pillarUrl}">${pillarTitle}</a>
  → Taruh dalam kalimat yang mengalir alami (misal: "Seperti yang sudah dibahas dalam panduan ${niche} kami...")
  → BUKAN sebagai catatan kaki. BUKAN ditempel di akhir secara paksa. DIJALIN secara alami.
- Contoh judul yang baik: jika niche "MPASI" dan sudut "kesalahan pemula" → "5 Kesalahan MPASI yang Sering Dilakukan Orang Tua Baru (dan Cara Menghindarinya)"`;
}
