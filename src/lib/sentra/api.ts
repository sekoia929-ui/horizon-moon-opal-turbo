import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Snapshot } from "./types";

const Input = z.object({
  asset: z.string().default("btc"),
  window: z.enum(["15m", "1h", "24h"]).default("1h"),
});

export const getSnapshot = createServerFn({ method: "POST" })
  .validator(Input)
  .handler(async ({ data }): Promise<Snapshot> => {
    const { buildSnapshot } = await import("./engine.server");
    return buildSnapshot(data.asset, data.window);
  });

const RescoreInput = z.object({
  posts: z
    .array(
      z.object({
        id: z.string(),
        body: z.string(),
      }),
    )
    .max(12),
});

export type RescoreResult =
  | {
      ok: true;
      scores: { id: string; score: number; label: string; rationale: string }[];
    }
  | { ok: false; error: string };

export const rescoreWithGrok = createServerFn({ method: "POST" })
  .validator(RescoreInput)
  .handler(async ({ data }): Promise<RescoreResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error: "Grok scoring is unavailable in this environment.",
      };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 700,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "You are a financial sentiment classifier. For each post return a JSON array of objects with keys id, score (-1 to 1), label (Bullish|Bearish|Neutral), rationale (≤12 words). Reply with JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify(data.posts),
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `xAI API error ${res.status}` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return { ok: false, error: "Could not parse Grok response." };
    try {
      const scores = JSON.parse(match[0]) as {
        id: string;
        score: number;
        label: string;
        rationale: string;
      }[];
      return { ok: true, scores };
    } catch {
      return { ok: false, error: "Could not parse Grok response." };
    }
  });
