import { NextRequest, NextResponse } from "next/server";
import { tryFreeAI } from "@/open-router/openrouter";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  getLocationContext,
  getCompetitors,
  getAutosuggestSeeds,
} from "@/lib/enrichment";
import type {
  EnrichedLocation,
  Competitor,
  AutosuggestSeed,
} from "@/types/enrichment";

interface VendorSEORequest {
  vendorId: string;
  businessType: string; // e.g., "fashion", "restaurant"
  businessModel: "online" | "brick_and_mortar" | "hybrid";
  niche: string;
  location: string;
  nearestAreas?: string[];
  targetGender?: string;
  priceTier?: string;
  styleTags?: string[];
}

interface AIResponse {
  vendorId: string;
  keywords: string[];
}

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const {
      vendorId,
      businessType,
      businessModel,
      niche,
      location,
      nearestAreas = [],
      targetGender,
      priceTier,
      styleTags = [],
    }: VendorSEORequest = await req.json();

    if (!vendorId || !businessType || !businessModel || !niche || !location) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // ---------- Enrichment ----------
    const loc: EnrichedLocation | null = await getLocationContext(location);
    let competitors: Competitor[] = [];
    let autosuggestSeeds: AutosuggestSeed[] = [];

    if (loc) {
      competitors = await getCompetitors(loc.city, niche, loc.lat, loc.lon);

      const baseTerms: string[] = [
        `${niche} ${loc.city}`,
        `${businessType} ${loc.city}`,
        `${businessType} ${loc.city} ${targetGender ?? ""}`.trim(),
      ];
      autosuggestSeeds = await getAutosuggestSeeds(baseTerms);
    }

    // ---------- Timeframe ----------
    const currentYear = new Date().getFullYear();
    const currentMonthInWords = new Intl.DateTimeFormat("en-US", {
      month: "long",
    }).format(new Date());

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoInWords = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(threeMonthsAgo);

    // ---------- AI Prompts ----------
    const competitorNames = competitors.map((c) => c.name).join(", ") || "none";
    const autosuggestPhrases =
      autosuggestSeeds.map((s) => s.suggestion).join(", ") || "none";

    const systemPrompt = `
You are an experienced SEO strategist and keyword researcher. 
Your task is to generate high-ranking, long-tail SEO keywords with strong buyer intent. 
The output must always be a valid JSON array of strings.
`;

    const userPrompt = `
Context:
- Business type: ${businessType}
- Business model: ${businessModel}
- Niche: ${niche}
- Location: ${location}
- Nearest areas: ${nearestAreas.join(", ") || "none"}
- Competitors: ${competitorNames}
- Autosuggest hints: ${autosuggestPhrases}
- Target audience (gender): ${targetGender || "all"}
- Price tier: ${priceTier || "all"}
- Style tags: ${styleTags.join(", ") || "none"}
- Timeframe: ${threeMonthsAgoInWords} to ${currentMonthInWords} ${currentYear} (last 3 months)

Task:
Generate up to 30 SEO keywords that:
- Reflect real search behavior from users
- Show buyer intent (e.g., "buy", "order online", "affordable", "best")
- Are location-specific (include neighborhoods, suburbs, or city areas)
- Are fresh and relevant to the timeframe
- Exclude brand names unless provided in input
- Output ONLY as JSON array of strings

Example (generic across niches):
["best catering services in Lagos",
 "affordable bridal gowns Port Harcourt",
 "top luxury apartments Owerri",
 "buy organic groceries online Abuja",
 "children birthday costume rentals Ikeja"]

If no keywords are available, return ["I can't find any keyword"].
`;

    // ---------- AI Call ----------
    // ---------- AI Call ----------
    const rawResult = await tryFreeAI(systemPrompt, userPrompt);

    // 🚨 Debug log to Supabase
    await supabase.from("seo_logs").insert({
      entity: "vendor",
      entity_id: vendorId,
      action: "debug_ai_output",
      inputs: { vendorId, niche, location },
      outputs: { rawResult },
    });

    let keywords: string[] = [];
    try {
      const parsed = JSON.parse(rawResult as unknown as string);
      if (Array.isArray(parsed) && parsed.every((k) => typeof k === "string")) {
        keywords = parsed;
      }
    } catch {
      keywords = (rawResult as unknown as string)
        .split(/,|\n/)
        .map((k) => k.trim().replace(/^"+|"+$/g, ""))
        .filter((k) => k.length > 0);
    }

    // ---------- Save to DB ----------
    const { error: insertError } = await supabase
      .from("vendor_seo_keywords")
      .upsert({
        vendor_id: vendorId,
        business_type: businessType,
        business_model: businessModel,
        niche,
        location,
        nearest_areas: nearestAreas,
        target_gender: targetGender,
        price_tier: priceTier,
        style_tags: styleTags,
        keywords,
      });

    if (insertError) throw insertError;

    // ---------- Log ----------
    await supabase.from("seo_logs").insert({
      entity: "vendor",
      entity_id: vendorId,
      action: "generate",
      inputs: { vendorId, niche, location },
      outputs: { keywords },
    });

    return NextResponse.json({ vendorId, keywords } as AIResponse);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate.";
    console.error("SEO Vendor API Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
