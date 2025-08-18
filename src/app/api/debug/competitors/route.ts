// /app/api/debug/competitors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getLocationContext, getCompetitors } from "@/lib/enrichment";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const niche = searchParams.get("niche") || "fashion";

  if (!city) {
    return NextResponse.json(
      { error: "Missing city parameter" },
      { status: 400 }
    );
  }

  try {
    const location = await getLocationContext(city);
    if (!location) {
      return NextResponse.json(
        { error: `Could not resolve location for ${city}` },
        { status: 404 }
      );
    }

    const { lat, lon } = location; // now definitely numbers
    const competitors = await getCompetitors(city, niche, lat, lon);

    return NextResponse.json({
      city,
      niche,
      location,
      competitors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
