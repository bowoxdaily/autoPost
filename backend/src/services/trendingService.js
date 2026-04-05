import googleTrends from 'google-trends-api';

const FALLBACK_TOPICS = {
  id: [
    'Strategi Digital Marketing',
    'Tips Optimasi SEO',
    'Panduan Social Media Marketing',
    'Strategi Email Marketing',
    'Cara Meningkatkan Conversion Rate',
    'Strategi Branding Bisnis',
    'Tips Produktivitas Kerja Remote',
    'Strategi Lead Generation',
    'Tips Customer Engagement',
    'Strategi Pertumbuhan Bisnis'
  ],
  en: [
    'Digital Marketing Strategy',
    'SEO Optimization Tips',
    'Social Media Marketing Guide',
    'Email Marketing Tactics',
    'Conversion Rate Optimization',
    'Brand Building Strategies',
    'Remote Work Productivity Tips',
    'Lead Generation Methods',
    'Customer Engagement Techniques',
    'Business Growth Strategies'
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLanguageConfig(language) {
  if (language === 'en') {
    return { geo: 'US', hl: 'en-US', key: 'en' };
  }
  return { geo: 'ID', hl: 'id', key: 'id' };
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3);
}

function extractQueryFromTrendItem(item) {
  if (!item) return null;
  // Most common shape from google-trends-api dailyTrends
  if (item?.title?.query && typeof item.title.query === 'string') return item.title.query;
  // Other possible shapes (defensive)
  if (typeof item.query === 'string') return item.query;
  if (typeof item.title === 'string') return item.title;
  if (item?.title?.text && typeof item.title.text === 'string') return item.title.text;
  return null;
}

export async function getTrendingTopic(language = 'id', niche = '') {
  const { geo, hl, key } = getLanguageConfig(language);
  const cleanNiche = String(niche || '').trim();

  try {
    // 1) If niche is provided, try to get related trending queries from that niche first
    if (cleanNiche) {
      try {
        const relatedRaw = await googleTrends.relatedQueries({
          keyword: cleanNiche,
          geo,
          hl
        });
        const relatedParsed = JSON.parse(relatedRaw);
        const ranked = relatedParsed?.default?.rankedList || [];

        const extractList = (listObj) => {
          const arr = listObj?.rankedKeyword || [];
          return Array.isArray(arr)
            ? arr.map(i => i?.query).filter(q => q && q.trim())
            : [];
        };

        // Prefer rising, then top
        const rising = extractList(ranked[1]);
        const top = extractList(ranked[0]);
        const relatedCandidates = [...rising, ...top];
        if (relatedCandidates.length > 0) {
          return relatedCandidates[0].trim();
        }
      } catch (err) {
        console.warn(`[Trending] relatedQueries failed for niche "${cleanNiche}": ${err.message}`);
      }
    }

    // 2) Fallback to daily trends feed (optionally filtered by niche)
    const raw = await googleTrends.dailyTrends({
      trendDate: new Date(),
      geo,
      hl
    });

    const parsed = JSON.parse(raw);
    const days = parsed?.default?.trendingSearchesDays;
    const today = Array.isArray(days) && days.length > 0 ? days[0] : null;
    const searches = today?.trendingSearches;

    if (Array.isArray(searches) && searches.length > 0) {
      const nicheTokens = tokenize(niche);
      const candidates = searches
        .slice(0, 15)
        .map(s => extractQueryFromTrendItem(s))
        .filter(q => q && q.trim());

      if (candidates.length === 0) return cleanNiche || pickRandom(FALLBACK_TOPICS[key]);

      if (nicheTokens.length === 0) {
        return candidates[0].trim();
      }

      // Simple relevance scoring: count niche tokens appearing in the candidate query
      const scored = candidates.map(q => {
        const qNorm = q.toLowerCase();
        let score = 0;
        for (const t of nicheTokens) {
          if (qNorm.includes(t)) score += 1;
        }
        return { q, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];

      // If nothing matches niche, prefer niche itself over unrelated trend.
      if (!best || best.score === 0) return cleanNiche;
      return best.q.trim();
    }
  } catch (error) {
    console.warn(`[Trending] Failed to fetch trends (${geo}): ${error.message}`);
  }

  // 3) Final fallback: niche first (if provided), otherwise static defaults
  return cleanNiche || pickRandom(FALLBACK_TOPICS[key]);
}

export async function getTrendingKeywords(language = 'id', seedKeyword = '') {
  const { geo, hl } = getLanguageConfig(language);
  const cleanSeed = String(seedKeyword || '').trim();

  const uniq = (arr) => [...new Set((arr || []).map(v => String(v || '').trim()).filter(Boolean))];

  try {
    if (cleanSeed) {
      try {
        const relatedRaw = await googleTrends.relatedQueries({
          keyword: cleanSeed,
          geo,
          hl
        });
        const relatedParsed = JSON.parse(relatedRaw);
        const ranked = relatedParsed?.default?.rankedList || [];

        const extractList = (listObj) => {
          const arr = listObj?.rankedKeyword || [];
          return Array.isArray(arr)
            ? arr.map(i => i?.query).filter(q => q && q.trim())
            : [];
        };

        const rising = extractList(ranked[1]);
        const top = extractList(ranked[0]);
        const relatedCandidates = uniq([cleanSeed, ...rising, ...top]).slice(0, 6);
        if (relatedCandidates.length > 0) return relatedCandidates;
      } catch (err) {
        console.warn(`[Trending] related keywords failed for "${cleanSeed}": ${err.message}`);
      }
    }

    const raw = await googleTrends.dailyTrends({
      trendDate: new Date(),
      geo,
      hl
    });

    const parsed = JSON.parse(raw);
    const days = parsed?.default?.trendingSearchesDays;
    const today = Array.isArray(days) && days.length > 0 ? days[0] : null;
    const searches = today?.trendingSearches;

    if (Array.isArray(searches) && searches.length > 0) {
      const daily = searches
        .slice(0, 12)
        .map(s => extractQueryFromTrendItem(s))
        .filter(q => q && q.trim());

      return uniq([cleanSeed, ...daily]).slice(0, 6);
    }
  } catch (error) {
    console.warn(`[Trending] Failed to fetch trending keywords (${geo}): ${error.message}`);
  }

  return uniq([cleanSeed]);
}

