//#region node_modules/.nitro/vite/services/ssr/assets/engine.server-DkxaARZM.js
var _0002_sentra_default = "create table if not exists market_snapshots (\n  id serial primary key,\n  asset text not null,\n  ts timestamptz not null default now(),\n  price double precision not null,\n  volume double precision not null,\n  change_24h double precision not null\n);\ncreate index if not exists market_snapshots_asset_ts_idx\n  on market_snapshots (asset, ts desc);\n\ncreate table if not exists sentiment_snapshots (\n  id serial primary key,\n  asset text not null,\n  window_key text not null,\n  ts timestamptz not null default now(),\n  score double precision not null,\n  ma15 double precision not null,\n  ma1h double precision not null,\n  ma24h double precision not null,\n  social_volume integer not null,\n  bullish_share double precision not null\n);\ncreate index if not exists sentiment_snapshots_asset_ts_idx\n  on sentiment_snapshots (asset, ts desc);\n\ncreate table if not exists social_posts (\n  id text primary key,\n  asset text not null,\n  author text not null,\n  handle text not null,\n  body text not null,\n  score double precision not null,\n  label text not null,\n  reach integer not null,\n  source text not null,\n  ts timestamptz not null\n);\ncreate index if not exists social_posts_asset_ts_idx\n  on social_posts (asset, ts desc);\n\ncreate table if not exists alert_events (\n  id text primary key,\n  asset text not null,\n  kind text not null,\n  message text not null,\n  severity text not null,\n  ts timestamptz not null default now()\n);\ncreate index if not exists alert_events_ts_idx\n  on alert_events (ts desc);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_sentra.sql": _0002_sentra_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
var ASSETS = [
	{
		id: "btc",
		symbol: "BTC",
		name: "Bitcoin",
		geckoId: "bitcoin",
		binance: "BTCUSDT",
		tags: [
			"$btc",
			"bitcoin",
			"btc"
		],
		color: "#9aa7b4"
	},
	{
		id: "eth",
		symbol: "ETH",
		name: "Ethereum",
		geckoId: "ethereum",
		binance: "ETHUSDT",
		tags: [
			"$eth",
			"ethereum",
			"eth"
		],
		color: "#7d93a8"
	},
	{
		id: "sol",
		symbol: "SOL",
		name: "Solana",
		geckoId: "solana",
		binance: "SOLUSDT",
		tags: [
			"$sol",
			"solana",
			"sol"
		],
		color: "#6f9b8a"
	},
	{
		id: "doge",
		symbol: "DOGE",
		name: "Dogecoin",
		geckoId: "dogecoin",
		binance: "DOGEUSDT",
		tags: [
			"$doge",
			"dogecoin",
			"doge"
		],
		color: "#b39b74"
	},
	{
		id: "xrp",
		symbol: "XRP",
		name: "XRP",
		geckoId: "ripple",
		binance: "XRPUSDT",
		tags: [
			"$xrp",
			"ripple",
			"xrp"
		],
		color: "#7f8aa0"
	},
	{
		id: "link",
		symbol: "LINK",
		name: "Chainlink",
		geckoId: "chainlink",
		binance: "LINKUSDT",
		tags: [
			"$link",
			"chainlink",
			"link"
		],
		color: "#6e8fb3"
	}
];
var ASSET_MAP = Object.fromEntries(ASSETS.map((a) => [a.id, a]));
function isAssetId(value) {
	return ASSETS.some((a) => a.id === value);
}
function pearson(xs, ys) {
	const n = Math.min(xs.length, ys.length);
	if (n < 4) return 0;
	let sx = 0;
	let sy = 0;
	let sxx = 0;
	let syy = 0;
	let sxy = 0;
	for (let i = 0; i < n; i += 1) {
		const x = xs[i] ?? 0;
		const y = ys[i] ?? 0;
		sx += x;
		sy += y;
		sxx += x * x;
		syy += y * y;
		sxy += x * y;
	}
	const cov = sxy - sx * sy / n;
	const vx = sxx - sx * sx / n;
	const vy = syy - sy * sy / n;
	const den = Math.sqrt(vx * vy);
	if (den < 1e-12) return 0;
	return Math.max(-1, Math.min(1, cov / den));
}
function returns(values) {
	const out = [];
	for (let i = 1; i < values.length; i += 1) {
		const prev = values[i - 1] ?? 0;
		const cur = values[i] ?? 0;
		if (prev <= 0) {
			out.push(0);
			continue;
		}
		out.push((cur - prev) / prev);
	}
	return out;
}
function leadLag(series, barMinutes) {
	const prices = series.map((p) => p.price);
	const sents = series.map((p) => p.sentiment);
	const rPrice = returns(prices);
	const rSent = sents.slice(1);
	const n = Math.min(rPrice.length, rSent.length);
	const a = rPrice.slice(0, n);
	const b = rSent.slice(0, n);
	const maxLag = Math.min(8, Math.floor(n / 5));
	let bestLag = 0;
	let bestCorr = pearson(a, b);
	for (let lag = -maxLag; lag <= maxLag; lag += 1) {
		if (lag === 0) continue;
		let xs;
		let ys;
		if (lag > 0) {
			xs = b.slice(0, n - lag);
			ys = a.slice(lag);
		} else {
			const k = -lag;
			xs = b.slice(k);
			ys = a.slice(0, n - k);
		}
		const c = pearson(xs, ys);
		if (Math.abs(c) > Math.abs(bestCorr)) {
			bestCorr = c;
			bestLag = lag;
		}
	}
	const lagMinutes = bestLag * barMinutes;
	let interpretation;
	if (Math.abs(bestCorr) < .12) interpretation = "No reliable link this window — sentiment and price are moving independently.";
	else if (lagMinutes < 0) interpretation = `Sentiment leads price by ${Math.abs(lagMinutes)}m (r=${bestCorr.toFixed(2)}). Voice is arriving before the print.`;
	else if (lagMinutes > 0) interpretation = `Price leads sentiment by ${lagMinutes}m (r=${bestCorr.toFixed(2)}). The tape is setting the conversation.`;
	else interpretation = `Contemporaneous move (r=${bestCorr.toFixed(2)}). Sentiment and price are printing together.`;
	return {
		pearson: bestCorr,
		lagMinutes,
		interpretation
	};
}
var BULLISH = {
	moon: .9,
	mooning: .85,
	breakout: .75,
	accumulation: .55,
	accumulate: .5,
	long: .35,
	longs: .35,
	buy: .45,
	buying: .5,
	rally: .7,
	ath: .65,
	squeeze: .55,
	undervalued: .6,
	bullish: .85,
	bull: .55,
	pump: .45,
	green: .3,
	support: .35,
	rebound: .5,
	recovery: .5,
	upside: .45,
	bid: .25,
	bids: .3,
	demand: .35,
	inflow: .5,
	inflows: .55,
	etf: .25,
	approval: .4,
	partnership: .35,
	upgrade: .4,
	adoption: .45,
	strong: .25,
	strength: .3,
	hold: .15,
	holding: .2,
	higher: .3,
	highs: .35,
	surge: .55,
	rip: .4,
	ripped: .45,
	rocket: .5,
	reclaim: .45,
	flip: .2,
	whale: .15,
	whales: .15
};
var BEARISH = {
	dump: .85,
	dumping: .8,
	crash: .9,
	crashing: .85,
	sell: .45,
	selling: .55,
	sold: .4,
	short: .4,
	shorts: .4,
	rug: .95,
	rugged: .95,
	liquidation: .75,
	liquidated: .8,
	liquidations: .7,
	breakdown: .7,
	overvalued: .55,
	bearish: .85,
	bear: .5,
	red: .3,
	resistance: .25,
	rejected: .5,
	rejection: .5,
	downside: .45,
	outflow: .5,
	outflows: .55,
	hack: .8,
	exploit: .75,
	lawsuit: .55,
	ban: .5,
	delay: .3,
	delayed: .3,
	fear: .45,
	panic: .7,
	weak: .3,
	weakness: .4,
	lower: .25,
	lows: .3,
	bleed: .55,
	bleeding: .6,
	unwind: .4,
	capitulation: .8,
	cascade: .65,
	risk: .2,
	off: .1
};
var NEGATIONS = /* @__PURE__ */ new Set([
	"not",
	"no",
	"never",
	"without",
	"dont",
	"don't",
	"isn't",
	"isnt",
	"wasn't",
	"wasnt",
	"hardly",
	"barely"
]);
var INTENSIFIERS = {
	extremely: 1.45,
	very: 1.25,
	hugely: 1.4,
	massively: 1.4,
	seriously: 1.2,
	really: 1.15,
	highly: 1.25,
	sharply: 1.3,
	aggressively: 1.3,
	slightly: .7,
	somewhat: .75,
	maybe: .6
};
function tokenize(text) {
	return text.toLowerCase().replace(/https?:\/\/\S+/g, " ").replace(/[^a-z0-9$'\s]/g, " ").split(/\s+/).filter(Boolean);
}
function classifyText(text) {
	const tokens = tokenize(text);
	if (tokens.length === 0) return {
		score: 0,
		label: "Neutral"
	};
	let acc = 0;
	let hits = 0;
	for (let i = 0; i < tokens.length; i += 1) {
		const bare = (tokens[i] ?? "").replace(/^\$/, "");
		const bull = BULLISH[bare];
		const bear = BEARISH[bare];
		if (!bull && !bear) continue;
		const prev = tokens[i - 1] ?? "";
		const prev2 = tokens[i - 2] ?? "";
		const negated = NEGATIONS.has(prev) || NEGATIONS.has(prev2);
		const intensity = INTENSIFIERS[prev] ?? 1;
		let w = (bull ?? 0) - (bear ?? 0);
		w *= intensity;
		if (negated) w *= -.85;
		acc += w;
		hits += 1;
	}
	const density = hits / Math.max(tokens.length, 1);
	let score = hits === 0 ? 0 : acc / (hits + .65);
	score *= .72 + Math.min(density * 2.2, .28);
	score = Math.max(-1, Math.min(1, score));
	return {
		score,
		label: score >= .12 ? "Bullish" : score <= -.12 ? "Bearish" : "Neutral"
	};
}
function weightByReach(score, reach, engagements = 0) {
	const reachW = Math.log10(1 + Math.max(reach, 0)) / 6;
	const engW = 1 + Math.min(engagements / 800, 1.6);
	return Math.max(-1, Math.min(1, score * (.35 + reachW) * engW));
}
function signalFromScore(score) {
	if (score >= .55) return { label: "Strong bullish" };
	if (score >= .15) return { label: "Bullish" };
	if (score <= -.55) return { label: "Strong bearish" };
	if (score <= -.15) return { label: "Bearish" };
	return { label: "Neutral" };
}
function mean(values) {
	if (values.length === 0) return 0;
	return values.reduce((a, b) => a + b, 0) / values.length;
}
function movingAverage(values, window) {
	if (values.length === 0) return 0;
	return mean(values.slice(-window));
}
function clip(n, lo = -1, hi = 1) {
	return Math.max(lo, Math.min(hi, n));
}
function tanh(n) {
	const e = Math.exp(-2 * Math.max(-20, Math.min(20, n)));
	return (1 - e) / (1 + e);
}
var DESKS = [
	{
		author: "Meridian Desk",
		handle: "meridian_desk",
		reach: 182e3
	},
	{
		author: "Northslope",
		handle: "northslope",
		reach: 96400
	},
	{
		author: "Flow Notes",
		handle: "flownotes",
		reach: 74200
	},
	{
		author: "Rangebound",
		handle: "rangebound",
		reach: 41800
	},
	{
		author: "Onchain Pulse",
		handle: "onchainpulse",
		reach: 128500
	},
	{
		author: "Desk Alpha",
		handle: "desk_alpha",
		reach: 63e3
	}
];
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a += 1831565813;
		let t = a;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function pickAssetFromText(text) {
	const lower = text.toLowerCase();
	for (const asset of ASSETS) if (asset.tags.some((tag) => lower.includes(tag))) return asset.id;
	return null;
}
function postsFromNews(news, now) {
	const posts = [];
	for (const item of news) {
		const asset = pickAssetFromText(`${item.title} ${item.body} ${item.categories}`) ?? "btc";
		const { score: raw, label } = classifyText(`${item.title}. ${item.body}`);
		const reach = 4e4 + Math.min(item.source.length * 3200, 8e4) + (raw !== 0 ? 12e3 : 0);
		const weighted = weightByReach(raw, reach, 120);
		posts.push({
			id: `news-${item.id}`,
			asset,
			author: item.source || "Wire",
			handle: (item.source || "wire").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
			body: item.title.trim(),
			score: weighted,
			label,
			reach,
			source: "news",
			ts: new Date(item.published || now).toISOString(),
			url: item.url || void 0
		});
	}
	return posts;
}
function templatePost(quote, fng, surge, rng, minute, slot) {
	const meta = ASSET_MAP[quote.id];
	const desk = DESKS[Math.floor(rng() * DESKS.length)] ?? DESKS[0];
	const chg = quote.change24h;
	const chg1h = quote.change1h ?? chg / 24;
	const px = quote.price;
	const abs = Math.abs(chg);
	const dir = chg >= 0 ? "bid" : "offer";
	const lines = [];
	if (Math.abs(chg1h) >= 1.2) lines.push(`${meta.symbol} printed ${chg1h >= 0 ? "+" : ""}${chg1h.toFixed(2)}% in the last hour. Tape is leaning ${dir} — ${px.toFixed(px >= 100 ? 0 : 2)} is the number everyone is defending.`);
	if (abs >= 4) lines.push(`${meta.symbol} ${chg >= 0 ? "expanded" : "unwound"} ${abs.toFixed(1)}% on the day. This is a positioning move, not a headline spike.`);
	if (surge >= 2.2) lines.push(`Voice volume on ${meta.symbol} is ${surge.toFixed(1)}× the rolling baseline. When the crowd shows up this fast, the next 15 minutes usually decide the range.`);
	if (fng != null && (fng <= 25 || fng >= 75)) lines.push(`Fear & greed sitting at ${fng}. Historically ${meta.symbol} stops listening to the crowd from here — fade the extreme or wait for the flip.`);
	if (quote.high24h && quote.low24h) {
		const range = quote.high24h - quote.low24h;
		const loc = range > 0 ? (px - quote.low24h) / range : .5;
		if (loc > .85) lines.push(`${meta.symbol} hugging session highs. Either this is a grind-through or a textbook fade. Book is not neutral.`);
		else if (loc < .15) lines.push(`${meta.symbol} pressed into session lows. Dip-buyers are visible but thin. Need a reclaim before calling a base.`);
	}
	lines.push(`Watching ${meta.symbol} at ${px >= 100 ? px.toFixed(0) : px.toFixed(4)}. 24h ${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%. No thesis, just the tape.`);
	const body = lines[Math.floor(rng() * lines.length)] ?? lines[0] ?? "";
	const { score: raw, label } = classifyText(body);
	const reach = Math.round(desk.reach * (.72 + rng() * .5));
	const score = weightByReach(raw, reach, Math.round(80 + rng() * 900));
	const ts = (/* @__PURE__ */ new Date(minute * 6e4 - slot * 7 * 6e4)).toISOString();
	return {
		id: `soc-${quote.id}-${minute}-${slot}`,
		asset: quote.id,
		author: desk.author,
		handle: desk.handle,
		body,
		score,
		label,
		reach,
		source: "social",
		ts
	};
}
function derivedSocial(quotes, selected, fng, surge, now) {
	const minute = Math.floor(now / 6e4);
	const rng = mulberry32(minute * 17 + selected.length * 13);
	const focus = quotes.find((q) => q.id === selected);
	const others = quotes.filter((q) => q.id !== selected);
	const posts = [];
	if (focus) for (let i = 0; i < 4; i += 1) posts.push(templatePost(focus, fng, surge, rng, minute, i));
	for (let i = 0; i < 2; i += 1) {
		const q = others[Math.floor(rng() * others.length)];
		if (q) posts.push(templatePost(q, fng, surge * .6, rng, minute, i + 4));
	}
	return posts;
}
var g = globalThis;
function cache() {
	g.__sentraCache__ ??= {
		tickersAt: 0,
		tickers: null,
		tickerSource: "fallback",
		klines: {},
		newsAt: 0,
		news: [],
		fngAt: 0,
		fng: null
	};
	return g.__sentraCache__;
}
async function fetchJson(url, timeoutMs = 7e3) {
	const res = await fetch(url, {
		headers: {
			accept: "application/json",
			"user-agent": "Mozilla/5.0 SENTRA/1.0"
		},
		signal: AbortSignal.timeout(timeoutMs)
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return await res.json();
}
var FALLBACK_PX = {
	btc: 109400,
	eth: 4120,
	sol: 238,
	doge: .214,
	xrp: 2.82,
	link: 22.4
};
function seededJitter(id, now) {
	return ((Math.floor(now / 15e3) * 2654435761 + id.charCodeAt(0) * 97 >>> 0) % 1e3 / 1e3 - .5) * .003;
}
function fallbackQuotes(now) {
	return ASSETS.map((a) => {
		const j = seededJitter(a.id, now);
		const price = FALLBACK_PX[a.id] * (1 + j);
		const change24h = (j * 40 + (a.id === "btc" ? .4 : -.2)) * 3;
		return {
			id: a.id,
			symbol: a.symbol,
			name: a.name,
			price,
			change1h: change24h / 18,
			change24h,
			volume24h: 12e8 * (1 + Math.abs(j) * 8),
			sentiment: clip(tanh(change24h / 6)),
			high24h: price * 1.012,
			low24h: price * .988
		};
	});
}
async function fetchBinanceTickers() {
	const rows = await fetchJson(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(ASSETS.map((a) => a.binance)))}`);
	const bySym = new Map(rows.map((r) => [r.symbol, r]));
	return ASSETS.map((a) => {
		const row = bySym.get(a.binance);
		if (!row) throw new Error("missing ticker");
		const price = Number(row.lastPrice);
		const change24h = Number(row.priceChangePercent);
		return {
			id: a.id,
			symbol: a.symbol,
			name: a.name,
			price,
			change1h: null,
			change24h,
			volume24h: Number(row.quoteVolume),
			sentiment: clip(tanh(change24h / 7)),
			high24h: Number(row.highPrice),
			low24h: Number(row.lowPrice)
		};
	});
}
async function fetchGeckoTickers() {
	const rows = await fetchJson(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ASSETS.map((a) => a.geckoId).join(",")}&order=market_cap_desc&price_change_percentage=1h,24h`);
	const byId = new Map(rows.map((r) => [r.id, r]));
	return ASSETS.map((a) => {
		const row = byId.get(a.geckoId);
		if (!row) throw new Error("missing gecko");
		const change24h = row.price_change_percentage_24h ?? 0;
		const change1h = row.price_change_percentage_1h_in_currency ?? null;
		return {
			id: a.id,
			symbol: a.symbol,
			name: a.name,
			price: row.current_price,
			change1h,
			change24h,
			volume24h: row.total_volume,
			sentiment: clip(tanh(((change1h ?? change24h / 8) + change24h / 4) / 4)),
			high24h: row.high_24h,
			low24h: row.low_24h
		};
	});
}
async function getTickers(now) {
	const c = cache();
	if (c.tickers && now - c.tickersAt < 12e3) return {
		quotes: c.tickers,
		source: c.tickerSource
	};
	try {
		const quotes = await fetchBinanceTickers();
		c.tickers = quotes;
		c.tickersAt = now;
		c.tickerSource = "binance";
		return {
			quotes,
			source: "binance"
		};
	} catch {
		try {
			const quotes = await fetchGeckoTickers();
			c.tickers = quotes;
			c.tickersAt = now;
			c.tickerSource = "coingecko";
			return {
				quotes,
				source: "coingecko"
			};
		} catch {
			return {
				quotes: c.tickers ?? fallbackQuotes(now),
				source: c.tickers ? c.tickerSource : "fallback"
			};
		}
	}
}
async function fetchKlines(symbol, interval, limit) {
	return (await fetchJson(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)).map((r) => ({
		t: r[0],
		close: Number(r[4]),
		volume: Number(r[5]),
		high: Number(r[2]),
		low: Number(r[3])
	}));
}
function fallbackBars(price, now, count, stepMs) {
	const bars = [];
	let px = price * .992;
	for (let i = count; i >= 0; i -= 1) {
		const t = now - i * stepMs;
		const wave = Math.sin(i / 9) * .003 + Math.cos(i / 17) * .002;
		px = px * (1 + wave * .15);
		bars.push({
			t,
			close: px,
			volume: 40 + Math.abs(Math.sin(i / 5)) * 80,
			high: px * 1.002,
			low: px * .998
		});
	}
	if (bars.length) bars[bars.length - 1].close = price;
	return bars;
}
async function getBars(asset, window, price, now) {
	const c = cache();
	const spec = window === "15m" ? {
		interval: "1m",
		limit: 30,
		minutes: 1
	} : window === "1h" ? {
		interval: "1m",
		limit: 60,
		minutes: 1
	} : {
		interval: "15m",
		limit: 96,
		minutes: 15
	};
	const key = `${asset}:${spec.interval}:${spec.limit}`;
	const hit = c.klines[key];
	if (hit && now - hit.at < 15e3) return {
		bars: hit.bars,
		barMinutes: spec.minutes
	};
	try {
		const bars = await fetchKlines(ASSET_MAP[asset].binance, spec.interval, spec.limit);
		c.klines[key] = {
			at: now,
			bars
		};
		return {
			bars,
			barMinutes: spec.minutes
		};
	} catch {
		if (hit) return {
			bars: hit.bars,
			barMinutes: spec.minutes
		};
		return {
			bars: fallbackBars(price, now, spec.limit, spec.minutes * 6e4),
			barMinutes: spec.minutes
		};
	}
}
async function getFng(now) {
	const c = cache();
	if (now - c.fngAt < 3e5 && c.fng) return c.fng;
	try {
		const row = (await fetchJson("https://api.alternative.me/fng/?limit=1")).data?.[0];
		if (!row) return c.fng;
		c.fng = {
			value: Number(row.value),
			classification: row.value_classification
		};
		c.fngAt = now;
		return c.fng;
	} catch {
		return c.fng;
	}
}
async function getNews(now) {
	const c = cache();
	if (now - c.newsAt < 6e4 && c.news.length) return c.news;
	try {
		const items = ((await fetchJson("https://min-api.cryptocompare.com/data/v2/news/?lang=EN")).Data ?? []).slice(0, 24).map((n) => ({
			id: String(n.id),
			title: n.title,
			body: n.body ?? "",
			source: n.source_info?.name ?? "Wire",
			url: n.url,
			published: n.published_on * 1e3,
			categories: n.categories ?? ""
		}));
		c.news = items;
		c.newsAt = now;
		return items;
	} catch {
		return c.news;
	}
}
function newsImpulse(news, t, asset) {
	let acc = 0;
	for (const n of news) {
		const dt = t - n.published;
		if (dt < 0 || dt > 108e5) continue;
		const hay = `${n.title} ${n.categories}`.toLowerCase();
		const match = ASSET_MAP[asset].tags.some((tag) => hay.includes(tag));
		if (!match && asset !== "btc") continue;
		const decay = Math.exp(-dt / 33e5);
		const { score } = classifyText(`${n.title} ${n.body}`);
		acc += score * decay * (match ? 1 : .25);
	}
	return clip(acc, -1, 1);
}
function buildSeries(bars, news, asset, fng) {
	const vMean = mean(bars.map((b) => b.volume)) || 1;
	const fngBias = fng != null ? (fng - 50) / 50 : 0;
	let ema = 0;
	return bars.map((bar, i) => {
		const prev = bars[i - 1]?.close ?? bar.close;
		const ret = prev > 0 ? (bar.close - prev) / prev : 0;
		const vz = (bar.volume - vMean) / (vMean * .8);
		const impulse = newsImpulse(news, bar.t, asset);
		const raw = .34 * tanh(ret / .008) + .28 * tanh(vz) + .22 * impulse + .16 * fngBias;
		ema = i === 0 ? raw : ema * .72 + raw * .28;
		return {
			t: bar.t,
			price: bar.close,
			sentiment: clip(ema),
			volume: bar.volume
		};
	});
}
function volumeSurge(series, barMinutes) {
	const window = Math.max(1, Math.round(15 / barMinutes));
	const recent = mean(series.slice(-window).map((p) => Math.abs(p.sentiment) * 4 + 1));
	const base = mean(series.slice(0, -window).map((p) => Math.abs(p.sentiment) * 4 + 1)) || recent;
	return base > 0 ? recent / base : 1;
}
function buildAlerts(asset, series, surge, ma15, ma1h, now) {
	const alerts = [];
	if (surge >= 3) alerts.push({
		id: `surge-${asset}-${Math.floor(now / 6e4)}`,
		asset,
		kind: "volume_surge",
		message: `Sentiment volume on ${ASSET_MAP[asset].symbol} is ${surge.toFixed(1)}× the rolling baseline — 300% surge threshold breached.`,
		severity: surge >= 4.5 ? "critical" : "warn",
		ts: new Date(now).toISOString()
	});
	if (ma15 * ma1h < 0 && Math.abs(ma15) >= .12 && Math.abs(ma1h) >= .08) alerts.push({
		id: `flip-${asset}-${Math.floor(now / 18e4)}`,
		asset,
		kind: "sentiment_flip",
		message: `${ASSET_MAP[asset].symbol} 15-minute sentiment flipped ${ma15 > 0 ? "bearish → bullish" : "bullish → bearish"} against the hourly trend.`,
		severity: "warn",
		ts: new Date(now).toISOString()
	});
	const last = series[series.length - 1]?.sentiment ?? 0;
	if (Math.abs(last) >= .62) alerts.push({
		id: `ext-${asset}-${Math.floor(now / 3e5)}`,
		asset,
		kind: "extreme",
		message: `${ASSET_MAP[asset].symbol} tape is at ${last > 0 ? "euphoric" : "capitulative"} extreme (${last > 0 ? "+" : ""}${last.toFixed(2)}). Mean reversion risk is elevated.`,
		severity: "info",
		ts: new Date(now).toISOString()
	});
	return alerts;
}
async function persist(snapshot) {
	try {
		const sql = await getSql();
		const quote = snapshot.assets.find((a) => a.id === snapshot.selected);
		if (quote) {
			await sql`
        insert into market_snapshots (asset, price, volume, change_24h)
        values (${quote.id}, ${quote.price}, ${quote.volume24h}, ${quote.change24h})
      `;
			await sql`
        insert into sentiment_snapshots
          (asset, window_key, score, ma15, ma1h, ma24h, social_volume, bullish_share)
        values (
          ${snapshot.selected},
          ${snapshot.window},
          ${snapshot.signal.score},
          ${snapshot.signal.ma15},
          ${snapshot.signal.ma1h},
          ${snapshot.signal.ma24h},
          ${snapshot.signal.socialVolume},
          ${snapshot.signal.bullishShare}
        )
      `;
		}
		for (const post of snapshot.posts.slice(0, 12)) await sql`
        insert into social_posts (id, asset, author, handle, body, score, label, reach, source, ts)
        values (
          ${post.id}, ${post.asset}, ${post.author}, ${post.handle}, ${post.body},
          ${post.score}, ${post.label}, ${post.reach}, ${post.source}, ${post.ts}
        )
        on conflict (id) do nothing
      `;
		for (const alert of snapshot.alerts) await sql`
        insert into alert_events (id, asset, kind, message, severity, ts)
        values (${alert.id}, ${alert.asset}, ${alert.kind}, ${alert.message}, ${alert.severity}, ${alert.ts})
        on conflict (id) do nothing
      `;
	} catch {}
}
async function buildSnapshot(assetRaw, windowRaw) {
	const selected = isAssetId(assetRaw) ? assetRaw : "btc";
	const window = windowRaw === "15m" || windowRaw === "1h" || windowRaw === "24h" ? windowRaw : "1h";
	const now = Date.now();
	const [{ quotes, source }, fng, news] = await Promise.all([
		getTickers(now),
		getFng(now),
		getNews(now)
	]);
	const { bars, barMinutes } = await getBars(selected, window, (quotes.find((q) => q.id === selected) ?? quotes[0]).price, now);
	const series = buildSeries(bars, news, selected, fng?.value ?? null);
	const sentVals = series.map((p) => p.sentiment);
	const ma15 = movingAverage(sentVals, Math.max(1, Math.round(15 / barMinutes)));
	const ma1h = movingAverage(sentVals, Math.max(1, Math.round(60 / barMinutes)));
	const ma24h = movingAverage(sentVals, sentVals.length);
	const score = sentVals[sentVals.length - 1] ?? 0;
	const surge = volumeSurge(series, barMinutes);
	const newsPosts = postsFromNews(news, now);
	const social = derivedSocial(quotes, selected, fng?.value ?? null, surge, now);
	const posts = [...newsPosts, ...social].filter((p) => p.asset === selected || p.source === "news").sort((a, b) => Math.abs(b.score) * Math.log10(2 + b.reach) - Math.abs(a.score) * Math.log10(2 + a.reach)).slice(0, 10);
	const relevant = posts.filter((p) => p.asset === selected);
	const scored = relevant.length ? relevant : posts;
	const bullishShare = scored.length === 0 ? .5 : scored.filter((p) => p.score > .08).length / scored.length;
	const socialVolume = scored.reduce((acc, p) => acc + Math.log10(2 + p.reach), 0);
	const quotesWithSent = quotes.map((q) => q.id === selected ? {
		...q,
		sentiment: score
	} : q);
	const alerts = buildAlerts(selected, series, surge, ma15, ma1h, now);
	const snapshot = {
		generatedAt: new Date(now).toISOString(),
		sources: {
			prices: source,
			news: news.length > 0,
			fearGreed: Boolean(fng)
		},
		fearGreed: fng,
		assets: quotesWithSent,
		selected,
		window,
		series,
		signal: {
			label: signalFromScore(score).label,
			score,
			ma15,
			ma1h,
			ma24h,
			bullishShare,
			socialVolume: Math.round(socialVolume),
			volumeSurge: surge
		},
		correlation: leadLag(series, barMinutes),
		posts,
		alerts
	};
	persist(snapshot);
	return snapshot;
}
//#endregion
export { buildSnapshot };
