import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const askAi = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ task: z.string().max(200), context: z.string().max(20000) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { text: "", error: "AI is not available right now." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are the writing assistant for NeuralVarsity.ai, an AI education platform. Write clear, engaging, SEO-aware content in Markdown. Return only the requested content, no preamble." },
          { role: "user", content: `Task: ${data.task}\n\nCurrent post:\n${data.context || "(empty)"}` },
        ],
      }),
    });
    if (res.status === 429) return { text: "", error: "Too many requests — try again in a moment." };
    if (res.status === 402) return { text: "", error: "AI credits are used up." };
    if (!res.ok) return { text: "", error: "AI request failed." };
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { text: j.choices?.[0]?.message?.content ?? "", error: null };
  });
