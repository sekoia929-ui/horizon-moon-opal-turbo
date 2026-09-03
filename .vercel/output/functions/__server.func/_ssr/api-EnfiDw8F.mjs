import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as object, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-EnfiDw8F.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var Input = object({
	asset: string().default("btc"),
	window: _enum([
		"15m",
		"1h",
		"24h"
	]).default("1h")
});
var getSnapshot_createServerFn_handler = createServerRpc({
	id: "c2fe8d7a2d59aaf64f2fe1fd824cd1e29c29587b3f01e46ca259a4a2835963dc",
	name: "getSnapshot",
	filename: "src/lib/sentra/api.ts"
}, (opts) => getSnapshot.__executeServer(opts));
var getSnapshot = createServerFn({ method: "POST" }).validator(Input).handler(getSnapshot_createServerFn_handler, async ({ data }) => {
	const { buildSnapshot } = await import("./engine.server-DkxaARZM.mjs");
	return buildSnapshot(data.asset, data.window);
});
var RescoreInput = object({ posts: array(object({
	id: string(),
	body: string()
})).max(12) });
var rescoreWithGrok_createServerFn_handler = createServerRpc({
	id: "c29a850e44e3f0bb26018d58f134fc2b9015bbf12ab23aeac4ac9142bf347b2a",
	name: "rescoreWithGrok",
	filename: "src/lib/sentra/api.ts"
}, (opts) => rescoreWithGrok.__executeServer(opts));
var rescoreWithGrok = createServerFn({ method: "POST" }).validator(RescoreInput).handler(rescoreWithGrok_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Grok scoring is unavailable in this environment."
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 700,
			temperature: .1,
			messages: [{
				role: "system",
				content: "You are a financial sentiment classifier. For each post return a JSON array of objects with keys id, score (-1 to 1), label (Bullish|Bearish|Neutral), rationale (≤12 words). Reply with JSON only."
			}, {
				role: "user",
				content: JSON.stringify(data.posts)
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI API error ${res.status}`
	};
	const match = ((await res.json()).choices?.[0]?.message?.content ?? "").match(/\[[\s\S]*\]/);
	if (!match) return {
		ok: false,
		error: "Could not parse Grok response."
	};
	try {
		return {
			ok: true,
			scores: JSON.parse(match[0])
		};
	} catch {
		return {
			ok: false,
			error: "Could not parse Grok response."
		};
	}
});
//#endregion
export { getSnapshot_createServerFn_handler, rescoreWithGrok_createServerFn_handler };
