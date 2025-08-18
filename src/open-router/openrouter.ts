// @/open-router/openrouter.ts
let lastKeyIndex = 0;

export const apiKeys = [
  process.env.OPENROUTER_API_KEY_0!,
  process.env.OPENROUTER_API_KEY_1!,
  process.env.OPENROUTER_API_KEY_2!,
  process.env.OPENROUTER_API_KEY_3!,
  process.env.OPENROUTER_API_KEY_4!,
  process.env.OPENROUTER_API_KEY_5!,
  process.env.OPENROUTER_API_KEY_6!,
  process.env.OPENROUTER_API_KEY_7!,
  process.env.OPENROUTER_API_KEY_8!,
  process.env.OPENROUTER_API_KEY_9!,
  process.env.OPENROUTER_API_KEY_10!,
].filter(Boolean);

const workingModels = [
  "google/gemini-2.0-flash-exp:free:online",
  "mistralai/mistral-small-3.2-24b-instruct:free:online",
  "deepseek/deepseek-r1-distill-llama-70b:free:online",
  "meta-llama/llama-3.3-70b-instruct:free:online",
];

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 20000
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]) as Promise<Response>;
}

export async function tryFreeAI(
  systemPrompt: string,
  userPrompt: string
): Promise<string[]> {
  const totalKeys = apiKeys.length;
  if (totalKeys === 0) throw new Error("No API keys provided");

  for (const model of workingModels) {
    for (let i = 0; i < totalKeys; i++) {
      const keyIndex = (lastKeyIndex + i) % totalKeys;
      const key = apiKeys[keyIndex];

      try {
        console.log(`Trying model=${model} with keyIndex=${keyIndex}`);

        const res = await fetchWithTimeout(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            }),
          }
        );

        if (res.status === 429 || res.status === 402) continue;

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "Unknown error");

        lastKeyIndex = keyIndex;

        let rawContent = data.choices?.[0]?.message?.content ?? "";
        console.log("AI RAW CONTENT:", rawContent);

        // ✅ Strip code fences (```json ... ```)
        rawContent = rawContent.replace(/```json|```/gi, "").trim();

        // ✅ Try JSON parse first
        try {
          const parsed = JSON.parse(rawContent);
          if (Array.isArray(parsed)) {
            return parsed.map((k) => String(k).trim());
          }
        } catch {
          // not JSON, fallback
        }

        // ✅ Fallback: split into keywords
        return rawContent
          .split(/,|\n|;/)
          .map((k: string) => k.trim().replace(/^"+|"+$/g, ""))
          .filter((k: string) => k.length > 2);
      } catch (err) {
        console.warn(`Failed model=${model} keyIndex=${i}:`, err);
        continue;
      }
    }
  }

  throw new Error(
    "All keys and models failed. Please add more keys or retry later."
  );
}
