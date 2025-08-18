// openrouter.ts
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
];

const workingModels = [
  "mistralai/mistral-small-3.2-24b-instruct:free:online",
  "deepseek/deepseek-chat-v3-0324:free:free:online",
  "mistralai/mistral-small-3.1-24b-instruct:free:online",
  "qwen/qwq-32b:free:online",
  "deepseek/deepseek-r1-distill-llama-70b:free:online",
  "deepseek/deepseek-r1:free:online",
  "google/gemini-2.0-flash-exp:free:online",
  "meta-llama/llama-3.3-70b-instruct:free:online",
  "meta-llama/llama-3.2-3b-instruct:free:online",
  "qwen/qwen-2.5-72b-instruct:free:online",
  "meta-llama/llama-3.1-405b-instruct:free:online",
  "google/gemma-2-9b-it:free:online",
  "microsoft/mai-ds-r1:free:online",
  "deepseek/deepseek-r1-0528:free:online",
  "mistralai/mistral-7b-instruct:free:online",
  "mistralai/devstral-small-2505:free:online",
];

export async function tryFreeAI(systemPrompt: string, userPrompt: string) {
  for (const key of apiKeys) {
    for (const model of workingModels) {
      try {
        console.log("Current Model:", model);
        const res = await fetch(
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
              plugins: [{ id: "web", max_results: 3 }], // only works on some models
            }),
          }
        );

        const data = await res.json();

        if (res.status === 429) continue; // Too many requests - try next key/model
        if (res.status === 402) continue; // Insufficient credit - try next
        if (!res.ok) throw new Error(data?.error?.message || "Unknown error");

        return data.choices[0].message.content;
      } catch (err: any) {
        console.warn(`Model ${model} on key failed:`, err.message);
        continue; // Try next
      }
    }
  }
  throw new Error(
    "All keys and models failed. Please wait or rotate more accounts."
  );
}
