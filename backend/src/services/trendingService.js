import axios from 'axios';
import googleTrends from 'google-trends-api';

// Public Google Trends RSS feeds. These are far more reliable than the
// library's internal API endpoints (which now return HTML/consent pages),
// especially from datacenter IPs.
const RSS_ENDPOINTS = (geo) => [
  `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`,
  `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${encodeURIComponent(geo)}`
];

const RSS_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
};

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

function parseTrendsResponse(raw, sourceLabel) {
  if (typeof raw !== 'string') {
    throw new Error(`${sourceLabel} returned a non-text response`);
  }

  const normalized = raw.trim();
  if (!normalized) {
    throw new Error(`${sourceLabel} returned an empty response`);
  }

  if (normalized.startsWith('<')) {
    throw new Error(`${sourceLabel} returned HTML instead of JSON`);
  }

  try {
    return JSON.parse(normalized);
  } catch (error) {
    throw new Error(`${sourceLabel} returned invalid JSON: ${error.message}`);
  }
}

function decodeXmlEntities(str) {
  return String(str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Fetch trending search terms from Google Trends public RSS feeds.
// Returns an ordered list of trend titles (plus related news titles) or [].
async function fetchRssTrends(geo) {
  for (const url of RSS_ENDPOINTS(geo)) {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: RSS_HEADERS,
        responseType: 'text',
        transformResponse: [(data) => data]
      });

      const xml = String(response?.data || '');
      if (!xml || !xml.includes('<item')) {
        continue;
      }

      const results = [];
      const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
      let match;

      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];

        const titleMatch = block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/);
        const title = titleMatch ? decodeXmlEntities(titleMatch[1]) : '';
        if (title) results.push(title);

        // Related news headlines give richer keyword material.
        const newsRegex = /<ht:news_item_title\b[^>]*>([\s\S]*?)<\/ht:news_item_title>/g;
        let newsMatch;
        while ((newsMatch = newsRegex.exec(block)) !== null) {
          const headline = decodeXmlEntities(newsMatch[1]);
          if (headline) results.push(headline);
        }
      }

      if (results.length > 0) {
        return results;
      }
    } catch (err) {
      console.warn(`[Trending] RSS fetch failed (${url}): ${err.message}`);
    }
  }

  return [];
}

export async function getTrendingTopic(language = 'id', niche = '') {
  const { geo, hl, key } = getLanguageConfig(language);
  const cleanNiche = String(niche || '').trim();
  const nicheTokens = tokenize(cleanNiche);

  const pickFromList = (list) => {
    const candidates = (list || []).map(q => String(q || '').trim()).filter(Boolean);
    if (candidates.length === 0) return null;

    if (nicheTokens.length === 0) {
      return candidates[0];
    }

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
    if (best && best.score > 0) return best.q;
    // No niche match: prefer the niche itself over an unrelated trend.
    return cleanNiche || candidates[0];
  };

  // 0) Primary source: Google Trends RSS (reliable, no consent/captcha page).
  try {
    const rssTrends = await fetchRssTrends(geo);
    const picked = pickFromList(rssTrends);
    if (picked) return picked;
  } catch (error) {
    console.warn(`[Trending] RSS topic lookup failed (${geo}): ${error.message}`);
  }

  try {
    // 1) If niche is provided, try to get related trending queries from that niche first
    if (cleanNiche) {
      try {
        const relatedRaw = await googleTrends.relatedQueries({
          keyword: cleanNiche,
          geo,
          hl
        });
        const relatedParsed = parseTrendsResponse(relatedRaw, `relatedQueries(${geo})`);
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

    const parsed = parseTrendsResponse(raw, `dailyTrends(${geo})`);
    const days = parsed?.default?.trendingSearchesDays;
    const today = Array.isArray(days) && days.length > 0 ? days[0] : null;
    const searches = today?.trendingSearches;

    if (Array.isArray(searches) && searches.length > 0) {
      const candidates = searches
        .slice(0, 15)
        .map(s => extractQueryFromTrendItem(s))
        .filter(q => q && q.trim());

      const picked = pickFromList(candidates);
      if (picked) return picked;
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

  // 0) Primary source: Google Trends RSS.
  try {
    const rssTrends = await fetchRssTrends(geo);
    if (rssTrends.length > 0) {
      const seedTokens = tokenize(cleanSeed);
      let ordered = rssTrends;

      // If a seed is provided, surface seed-relevant trends first.
      if (seedTokens.length > 0) {
        const score = (q) => {
          const qNorm = q.toLowerCase();
          return seedTokens.reduce((acc, t) => acc + (qNorm.includes(t) ? 1 : 0), 0);
        };
        ordered = [...rssTrends].sort((a, b) => score(b) - score(a));
      }

      const keywords = uniq([cleanSeed, ...ordered]).slice(0, 6);
      if (keywords.length > 0) return keywords;
    }
  } catch (error) {
    console.warn(`[Trending] RSS keywords lookup failed (${geo}): ${error.message}`);
  }

  try {
    if (cleanSeed) {
      try {
        const relatedRaw = await googleTrends.relatedQueries({
          keyword: cleanSeed,
          geo,
          hl
        });
        const relatedParsed = parseTrendsResponse(relatedRaw, `relatedQueries(${geo})`);
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

    const parsed = parseTrendsResponse(raw, `dailyTrends(${geo})`);
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

