"use client";

import { useState } from "react";

export default function SeoTestPage() {
  const [vendorId, setVendorId] = useState("test-vendor-123");
  const [businessType, setBusinessType] = useState("fashion");
  const [businessModel, setBusinessModel] = useState<
    "online" | "brick_and_mortar" | "hybrid"
  >("online");
  const [niche, setNiche] = useState("bridal gowns");
  const [location, setLocation] = useState("Owerri");
  const [nearestAreas, setNearestAreas] = useState(
    "Nekede,Ihiagwa,Douglas Road"
  );
  const [targetGender, setTargetGender] = useState("women");
  const [priceTier, setPriceTier] = useState("affordable");
  const [styleTags, setStyleTags] = useState("modern,luxury");

  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setKeywords([]);

    try {
      const res = await fetch("/api/ai/seo-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          businessType,
          businessModel,
          niche,
          location,
          nearestAreas: nearestAreas.split(",").map((a) => a.trim()),
          targetGender,
          priceTier,
          styleTags: styleTags.split(",").map((t) => t.trim()),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      setKeywords(data.keywords || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">SEO Keyword Generator Debug</h1>

      <div className="grid gap-4 max-w-lg">
        <input
          className="border p-2 rounded"
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
          placeholder="Vendor ID"
        />
        <input
          className="border p-2 rounded"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          placeholder="Business Type"
        />
        <select
          className="border p-2 rounded"
          value={businessModel}
          onChange={(e) =>
            setBusinessModel(
              e.target.value as "online" | "brick_and_mortar" | "hybrid"
            )
          }
        >
          <option value="online">Online</option>
          <option value="brick_and_mortar">Brick & Mortar</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <input
          className="border p-2 rounded"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Niche"
        />
        <input
          className="border p-2 rounded"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City / Location"
        />
        <input
          className="border p-2 rounded"
          value={nearestAreas}
          onChange={(e) => setNearestAreas(e.target.value)}
          placeholder="Nearest Areas (comma-separated)"
        />
        <input
          className="border p-2 rounded"
          value={targetGender}
          onChange={(e) => setTargetGender(e.target.value)}
          placeholder="Target Gender"
        />
        <input
          className="border p-2 rounded"
          value={priceTier}
          onChange={(e) => setPriceTier(e.target.value)}
          placeholder="Price Tier"
        />
        <input
          className="border p-2 rounded"
          value={styleTags}
          onChange={(e) => setStyleTags(e.target.value)}
          placeholder="Style Tags (comma-separated)"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Keywords"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {keywords.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Generated Keywords:</h2>
          <ul className="list-disc pl-6 space-y-1">
            {keywords.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
