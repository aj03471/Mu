/**
 * Crowd-level data provider.
 *
 * IMPORTANT CONTEXT — read this before wiring up a "real" data source:
 * Google does not offer a public, official API for live "how busy is this place"
 * data. The busyness graphs you see on Google Maps are not exposed for third-party
 * use. Two realistic paths to real data:
 *
 *   1. SerpApi's "Google Maps" engine returns `popular_times` for many places
 *      (including a live "currently: X% busy" figure when available).
 *      https://serpapi.com/google-maps-api — paid, has a free trial tier.
 *      Set SERPAPI_KEY in your environment to enable this provider automatically.
 *
 *   2. A museum's own site/app — several major museums (Met, Smithsonian, MoMA)
 *      publish timed-entry ticket availability, which is a reasonable proxy for
 *      "how full is it right now." That requires a bespoke scraper per museum
 *      and isn't included here, but the provider interface below is built so
 *      you can drop one in as another `case` without touching the rest of the app.
 *
 * Until you add a real key, this file returns clearly-labeled MOCK data so the
 * whole app is runnable and demoable immediately after deploy.
 */

const HAS_SERPAPI = Boolean(process.env.SERPAPI_KEY);

function levelFromScore(score) {
  if (score == null) return { label: "Unknown", score: null };
  if (score < 30) return { label: "Quiet", score };
  if (score < 60) return { label: "Moderate", score };
  if (score < 85) return { label: "Busy", score };
  return { label: "Very Busy", score };
}

// Deterministic-ish mock: varies by museum + current hour, so it feels "live"
// without being pure random noise on every refresh within the same hour.
function mockScoreFor(museumId) {
  const hour = new Date().getHours();
  let hash = 0;
  for (const ch of museumId) hash = (hash * 31 + ch.charCodeAt(0)) % 97;

  // Rough shape: closed-ish late night/early morning, ramps up midday, tapers evening.
  const hourCurve = [
    5, 3, 2, 2, 2, 5, 10, 20, 35, 55, 70, 80,
    85, 82, 78, 70, 60, 48, 35, 22, 12, 8, 6, 5,
  ];
  const base = hourCurve[hour];
  const jitter = (hash % 15) - 7; // +/- ~7
  const score = Math.max(0, Math.min(100, base + jitter));
  return score;
}

async function fetchFromSerpApi(museum) {
  const params = new URLSearchParams({
    engine: "google_maps",
    q: museum.query,
    type: "search",
    api_key: process.env.SERPAPI_KEY,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  if (!res.ok) throw new Error(`SerpApi request failed: ${res.status}`);
  const json = await res.json();

  const place = json.place_results || (json.local_results && json.local_results[0]);
  const popularTimes = place && place.popular_times;

  // popular_times.live_hash / live percentage varies by response shape; guard defensively.
  const liveScore =
    popularTimes && popularTimes.live && typeof popularTimes.live.percentage === "number"
      ? popularTimes.live.percentage
      : null;

  return {
    ...levelFromScore(liveScore),
    source: "serpapi",
    raw: place ? { name: place.title, address: place.address } : null,
  };
}

async function getCrowdLevel(museum) {
  if (HAS_SERPAPI) {
    try {
      return await fetchFromSerpApi(museum);
    } catch (err) {
      // Fall back to mock rather than breaking the dashboard if the API hiccups.
      console.error(`SerpApi lookup failed for ${museum.id}:`, err.message);
    }
  }

  const score = mockScoreFor(museum.id);
  return { ...levelFromScore(score), source: "mock" };
}

module.exports = { getCrowdLevel, HAS_SERPAPI };
