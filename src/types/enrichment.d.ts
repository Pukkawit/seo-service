// /types/enrichment.ts
// Shared types for enrichment pipeline

export interface EnrichedLocation {
  city: string; // normalized input, e.g. "Owerri"
  displayName: string; // Nominatim display_name
  lat: number; // guaranteed number if EnrichedLocation is not null
  lon: number; // guaranteed number if EnrichedLocation is not null
  neighborhoods: string[]; // can expand later
}

export interface Competitor {
  name: string;
  type: string;
  street: string | null;
  suburb: string | null;
}

export interface AutosuggestSeed {
  seed: string;
  suggestion: string;
}

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    shop?: string;
    ["addr:street"]?: string;
    ["addr:suburb"]?: string;
    [key: string]: string | undefined; // allow other unknown tags
  };
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

export interface DuckDuckGoSuggestion {
  phrase: string;
}
