// /lib/enrichment.ts
// Utility functions for enriching SEO keyword generation
// Includes: Location context (Nominatim), Competitor discovery (Overpass API), Autosuggest (DuckDuckGo)

import type {
  EnrichedLocation,
  Competitor,
  AutosuggestSeed,
  OverpassResponse,
  DuckDuckGoSuggestion,
} from "@/types/enrichment";
import { cityFallbacks } from "./cityFallbacks";

// ---------- 1. Location enrichment via Nominatim ----------
// ---------- 1. Location enrichment via Nominatim ----------
export async function getLocationContext(
  city: string
): Promise<EnrichedLocation | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
      city
    )}&country=nigeria&format=json&addressdetails=1&extratags=1&limit=1`,
    { headers: { "User-Agent": "seo-keyword-service/1.0" } }
  );

  if (!res.ok) throw new Error(`Failed to fetch location for ${city}`);
  const data: Array<{ lat: string; lon: string; display_name: string }> =
    await res.json();

  if (!data || data.length === 0) return null;

  const { lat, lon, display_name } = data[0];

  return {
    city,
    displayName: display_name,
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    neighborhoods: [],
  };
}

// ---------- 2. Competitor discovery via Overpass + fallback ----------
export async function getCompetitors(
  city: string,
  niche: string,
  lat: number,
  lon: number
): Promise<Competitor[]> {
  const radiusMeters = 20000; // 20km search radius

  // --- 1. Query OSM for shops ---
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["shop"~"clothes|boutique|jewelry|fashion|tailor|shoes"](around:${radiusMeters},${lat},${lon});
      way["shop"~"clothes|boutique|jewelry|fashion|tailor|shoes"](around:${radiusMeters},${lat},${lon});
      relation["shop"~"clothes|boutique|jewelry|fashion|tailor|shoes"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

  const osmRes = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: overpassQuery,
  });

  const osmData: OverpassResponse = await osmRes.json();

  const competitors: Competitor[] = osmData.elements.map((el) => ({
    name: el.tags?.name ?? "Unnamed shop",
    type: el.tags?.shop ?? "unknown",
    street: el.tags?.["addr:street"] ?? null,
    suburb: el.tags?.["addr:suburb"] ?? null,
  }));

  if (competitors.length > 0) {
    return competitors.filter((c) => !!c.name);
  }

  // --- 2. DuckDuckGo autosuggest fallback ---
  const ddgUrl = `https://duckduckgo.com/ac/?q=${encodeURIComponent(
    `${niche} ${city}`
  )}&type=list`;

  const ddgRes = await fetch(ddgUrl);
  const ddgData: DuckDuckGoSuggestion[] = await ddgRes.json();

  const fallbackCompetitors: Competitor[] = ddgData.slice(0, 8).map((s) => ({
    name: s.phrase,
    type: "search-suggestion",
    street: null,
    suburb: city,
  }));

  // --- 3. Neighborhood enrichment (from OSM + fallback dict) ---
  const neighborhoodQuery = `
    [out:json][timeout:25];
    (
      node["place"~"suburb|quarter|neighbourhood|market"](around:${radiusMeters},${lat},${lon});
      way["place"~"suburb|quarter|neighbourhood|market"](around:${radiusMeters},${lat},${lon});
      relation["place"~"suburb|quarter|neighbourhood|market"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

  // --- 3. Neighborhood enrichment (from OSM + fallback dict) ---
  const nbRes = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: neighborhoodQuery,
  });

  const nbData: OverpassResponse = await nbRes.json();
  const osmNeighborhoods: string[] =
    nbData.elements
      .map((el) => el.tags?.name)
      .filter((name): name is string => Boolean(name)) ?? [];

  // Merge OSM + Fallback dictionary
  const neighborhoods: string[] = [
    ...osmNeighborhoods,
    ...(cityFallbacks[city] ?? []),
  ];

  const neighborhoodCompetitors: Competitor[] = neighborhoods.map((n) => ({
    name: `${niche} shop in ${n}`,
    type: "neighborhood",
    street: null,
    suburb: n,
  }));

  // --- 4. Merge + dedupe ---
  const merged: Competitor[] = [
    ...fallbackCompetitors,
    ...neighborhoodCompetitors,
  ];
  const seen = new Set<string>();
  const unique = merged.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  return unique.length > 0
    ? unique
    : [
        {
          name: `${niche} shops in ${city}`,
          type: "generic",
          street: null,
          suburb: city,
        },
      ];
}

// ---------- 3. DuckDuckGo autosuggest ----------
export async function getAutosuggestSeeds(
  terms: string[]
): Promise<AutosuggestSeed[]> {
  const suggestions: AutosuggestSeed[] = [];

  for (const term of terms) {
    const res = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(term)}`
    );
    if (!res.ok) continue;

    const data: DuckDuckGoSuggestion[] = await res.json();
    data.forEach((d) => {
      suggestions.push({ seed: term, suggestion: d.phrase });
    });
  }

  return suggestions;
}
