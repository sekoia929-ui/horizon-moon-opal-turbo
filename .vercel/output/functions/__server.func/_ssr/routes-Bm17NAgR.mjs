import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as rescoreWithGrok, n as Route, r as getSnapshot } from "./router-C0Kdu3Ct.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { a as Line, c as Tooltip, i as Area, n as YAxis, o as CartesianGrid, r as XAxis, s as ResponsiveContainer, t as ComposedChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Bm17NAgR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", {
	variants: { tone: {
		default: "bg-elevated text-muted",
		bull: "bg-bull/15 text-bull",
		bear: "bg-bear/15 text-bear",
		warn: "bg-warn/15 text-warn",
		accent: "bg-accent/15 text-accent"
	} },
	defaultVariants: { tone: "default" }
});
function Badge({ className, tone, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ tone }), className),
		...props
	});
}
function formatPrice(value) {
	const abs = Math.abs(value);
	const digits = abs >= 1e3 ? 2 : abs >= 1 ? 2 : abs >= .1 ? 4 : 6;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	}).format(value);
}
function formatPct(value, digits = 2) {
	return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}
function formatCompact(value) {
	return new Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1
	}).format(value);
}
function formatScore(value) {
	return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}
function formatTime(iso) {
	return new Date(iso).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	});
}
function formatClock(date) {
	return date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZone: "UTC"
	});
}
function signedClass(value) {
	if (value > .02) return "text-bull";
	if (value < -.02) return "text-bear";
	return "text-muted";
}
var KIND = {
	volume_surge: "Volume surge",
	sentiment_flip: "Sentiment flip",
	extreme: "Extreme tape"
};
function AlertLog({ alerts }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-surface p-4 shadow-border sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg text-fg",
				children: "Anomaly alerts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Fires on 15-minute sentiment flips and voice volume above 3× baseline."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 flex flex-col gap-2",
				children: alerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-lg bg-elevated px-3 py-4 text-sm text-muted",
					children: "Quiet tape — no surge or flip in this window."
				}) : alerts.map((alert) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg bg-elevated px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: alert.severity === "critical" ? "bear" : alert.severity === "warn" ? "warn" : "accent",
							children: KIND[alert.kind]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs tabular-nums text-subtle",
							children: formatTime(alert.ts)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-fg/90",
						children: alert.message
					})]
				}, alert.id))
			})
		]
	});
}
var WINDOWS = [
	"15m",
	"1h",
	"24h"
];
function tickTime(t, window) {
	const d = new Date(t);
	if (window === "24h") return d.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	});
	return d.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: window === "15m" ? "2-digit" : void 0,
		hour12: false
	});
}
function ChartTooltip({ active, payload }) {
	if (!active || !payload?.[0]) return null;
	const p = payload[0].payload;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-elevated px-3 py-2 text-xs shadow-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-subtle",
				children: new Date(p.t).toLocaleString("en-US", { hour12: false })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 tabular-nums text-fg",
				children: ["Price ", formatPrice(p.price)]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("tabular-nums", p.sentiment >= 0 ? "text-bull" : "text-bear"),
				children: [
					"Sentiment ",
					p.sentiment >= 0 ? "+" : "",
					p.sentiment.toFixed(2)
				]
			})
		]
	});
}
function ChartPanel({ symbol, series, window, onWindow }) {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setReady(true);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-surface p-4 shadow-border sm:p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "font-display text-lg text-fg",
				children: [symbol, " vs weighted voice"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Dual axis — price (line) against reach-weighted sentiment (fill)."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex rounded-full bg-elevated p-1",
				children: WINDOWS.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onWindow(w),
					className: cn("min-h-10 rounded-full px-3 text-xs font-medium transition-[background-color,color] duration-150 ease-out", window === w ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
					children: w
				}, w))
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 h-64 sm:h-80",
			children: ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
					data: series,
					margin: {
						top: 8,
						right: 8,
						left: 0,
						bottom: 0
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
							id: "sentFill",
							x1: "0",
							y1: "0",
							x2: "0",
							y2: "1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "0%",
								stopColor: "#9aa7b4",
								stopOpacity: .28
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "100%",
								stopColor: "#9aa7b4",
								stopOpacity: 0
							})]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
							stroke: "rgba(230,232,236,0.06)",
							vertical: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "t",
							tickFormatter: (t) => tickTime(Number(t), window),
							tick: {
								fill: "#8d939e",
								fontSize: 11
							},
							axisLine: false,
							tickLine: false,
							minTickGap: 28
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
							yAxisId: "price",
							orientation: "left",
							tickFormatter: (v) => formatPrice(Number(v)),
							tick: {
								fill: "#8d939e",
								fontSize: 11
							},
							axisLine: false,
							tickLine: false,
							width: 72,
							domain: ["auto", "auto"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
							yAxisId: "sent",
							orientation: "right",
							domain: [-1, 1],
							ticks: [
								-1,
								-.5,
								0,
								.5,
								1
							],
							tick: {
								fill: "#8d939e",
								fontSize: 11
							},
							axisLine: false,
							tickLine: false,
							width: 36
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartTooltip, {}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
							yAxisId: "sent",
							type: "monotone",
							dataKey: "sentiment",
							stroke: "#9aa7b4",
							strokeWidth: 1.4,
							fill: "url(#sentFill)",
							isAnimationActive: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
							yAxisId: "price",
							type: "monotone",
							dataKey: "price",
							stroke: "#e6e8ec",
							strokeWidth: 1.7,
							dot: false,
							isAnimationActive: false
						})
					]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full rounded-lg bg-elevated shimmer" })
		})]
	});
}
function SentraMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className,
		"aria-hidden": "true",
		fill: "none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "1",
				y: "1",
				width: "30",
				height: "30",
				rx: "7",
				className: "stroke-border",
				strokeWidth: "1"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 21.5 L13.5 12.5 L18 18.5 L24 9.5",
				className: "stroke-accent",
				strokeWidth: "1.8",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "24",
				cy: "9.5",
				r: "1.4",
				className: "fill-accent"
			})
		]
	});
}
function Header({ source, generatedAt }) {
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => window.clearInterval(id);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SentraMark, { className: "size-8" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-medium tracking-tight text-fg sm:text-2xl",
					children: "SENTRA"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden text-xs uppercase tracking-[0.18em] text-subtle sm:inline",
					children: "Sentiment × Impact"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Live crypto voice weighted by reach, plotted against the tape."
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3 text-xs tabular-nums text-muted",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-2 rounded-full bg-elevated px-2.5 py-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative flex size-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "live-dot absolute inset-0 rounded-full bg-bull" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative size-2 rounded-full bg-bull" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: "Live"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-subtle",
							children: source === "binance" ? "Binance" : source === "coingecko" ? "CoinGecko" : "Cached tape"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "hidden sm:inline",
					children: [formatClock(now), " UTC"]
				}),
				generatedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "hidden text-subtle lg:inline",
					children: ["print ", new Date(generatedAt).toLocaleTimeString("en-US", {
						hour12: false,
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit"
					})]
				}) : null
			]
		})]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 transition-[scale,background-color,color,opacity,box-shadow] duration-150 ease-out active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			secondary: "bg-elevated text-fg shadow-border hover:bg-surface",
			ghost: "text-muted hover:bg-elevated hover:text-fg",
			outline: "text-fg shadow-border hover:bg-elevated"
		},
		size: {
			default: "h-10 px-4 text-sm",
			sm: "h-8 px-3 text-xs",
			lg: "h-11 px-5 text-sm",
			icon: "size-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function toneFor(label) {
	if (label === "Bullish") return "bull";
	if (label === "Bearish") return "bear";
	return "default";
}
function PostFeed({ posts, onRescore }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function runGrok() {
		setBusy(true);
		try {
			const result = await rescoreWithGrok({ data: { posts: posts.slice(0, 8).map((p) => ({
				id: p.id,
				body: p.body
			})) } });
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			const byId = new Map(result.scores.map((s) => [s.id, s]));
			const next = posts.map((p) => {
				const hit = byId.get(p.id);
				if (!hit) return p;
				const label = hit.label === "Bullish" || hit.label === "Bearish" || hit.label === "Neutral" ? hit.label : p.label;
				return {
					...p,
					score: Math.max(-1, Math.min(1, hit.score)),
					label
				};
			});
			onRescore?.(next);
			toast.success("Posts re-scored with Grok");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Re-score failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-surface p-4 shadow-border sm:p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg text-fg",
				children: "Influential voice"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "News wires plus reach-weighted desk notes. Ranked by |score| × log(reach)."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				onClick: runGrok,
				disabled: busy || posts.length === 0,
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }) : null, "Re-score"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 flex flex-col gap-2",
			children: posts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "rounded-lg bg-elevated px-3 py-4 text-sm text-muted",
				children: "Waiting on the first print of market voice."
			}) : posts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-lg bg-elevated px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-[0.65rem] font-medium text-accent",
								children: post.author.slice(0, 2).toUpperCase()
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm text-fg",
									children: post.author
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-xs text-subtle",
									children: [
										"@",
										post.handle,
										" · ",
										formatTime(post.ts),
										" · ",
										formatCompact(post.reach),
										" reach"
									]
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("font-mono text-xs tabular-nums", post.score >= .12 ? "text-bull" : post.score <= -.12 ? "text-bear" : "text-muted"),
								children: formatScore(post.score)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: toneFor(post.label),
								children: post.label
							})]
						})]
					}),
					post.url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: post.url,
						target: "_blank",
						rel: "noreferrer",
						className: "mt-2 block text-sm leading-relaxed text-fg/90 hover:text-accent",
						children: post.body
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-fg/90",
						children: post.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1.5 text-xs uppercase tracking-wider text-subtle",
						children: [
							post.source === "news" ? "Wire" : "Desk",
							" · ",
							post.asset.toUpperCase()
						]
					})
				]
			}, post.id))
		})]
	});
}
function Meter({ value }) {
	const clamped = Math.max(-1, Math.min(1, value));
	const pct = (clamped + 1) / 2 * 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mt-3 h-2 rounded-full bg-elevated",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-y-0 left-1/2 w-px bg-border" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_3px_rgba(9,10,12,0.9)]", clamped >= .12 ? "bg-bull" : clamped <= -.12 ? "bg-bear" : "bg-accent"),
			style: { left: `${pct}%` }
		})]
	});
}
function SignalRail({ snapshot }) {
	const s = snapshot.signal;
	const tone = s.score >= .15 ? "text-bull" : s.score <= -.15 ? "text-bear" : "text-fg";
	const fng = snapshot.fearGreed;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-border sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.16em] text-subtle",
					children: "Signal"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("mt-1 font-display text-3xl leading-none", tone),
					children: s.label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 font-mono text-sm tabular-nums text-muted",
					children: [formatScore(s.score), " weighted score"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, { value: s.score }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex justify-between text-xs uppercase tracking-wider text-subtle",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Bear" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Neutral" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Bull" })
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "grid grid-cols-3 gap-2",
				children: [
					["15m", s.ma15],
					["1h", s.ma1h],
					["24h", s.ma24h]
				].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg bg-elevated px-2.5 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "text-xs uppercase tracking-wider text-subtle",
						children: [label, " MA"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: cn("font-mono text-sm tabular-nums", Number(value) >= .08 ? "text-bull" : Number(value) <= -.08 ? "text-bear" : "text-fg"),
						children: formatScore(Number(value))
					})]
				}, String(label)))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg bg-elevated p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-wider text-subtle",
						children: "Lead / lag"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-mono text-sm tabular-nums text-fg",
						children: [
							"r ",
							snapshot.correlation.pearson.toFixed(2),
							" · ",
							snapshot.correlation.lagMinutes,
							"m"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs leading-relaxed text-muted",
						children: snapshot.correlation.interpretation
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg bg-elevated p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-wider text-subtle",
						children: "Bullish share"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-mono tabular-nums text-fg",
						children: formatPct(s.bullishShare * 100, 0)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg bg-elevated p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-wider text-subtle",
						children: "Voice surge"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: cn("mt-1 font-mono tabular-nums", s.volumeSurge >= 3 ? "text-warn" : "text-fg"),
						children: [s.volumeSurge.toFixed(1), "×"]
					})]
				})]
			}),
			fng ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg bg-elevated p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-wider text-subtle",
					children: "Fear & greed"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 font-mono text-sm tabular-nums text-fg",
					children: [
						fng.value,
						" · ",
						fng.classification
					]
				})]
			}) : null
		]
	});
}
function Ticker({ assets, selected, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:grid lg:grid-cols-6 lg:overflow-visible",
		children: assets.map((asset) => {
			const active = asset.id === selected;
			const sent = asset.sentiment;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onSelect(asset.id),
				className: cn("min-w-40 flex-1 rounded-xl bg-surface p-3 text-left shadow-border transition-[background-color,box-shadow] duration-150 ease-out hover:bg-elevated", active ? "bg-elevated shadow-focus" : null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium tracking-wide text-muted",
							children: asset.symbol
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: cn("text-xs tabular-nums", sent >= .12 ? "text-bull" : sent <= -.12 ? "text-bear" : "text-subtle"),
							children: [sent >= 0 ? "+" : "", sent.toFixed(2)]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-mono text-sm tabular-nums text-fg",
						children: formatPrice(asset.price)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("mt-0.5 text-xs tabular-nums", signedClass(asset.change24h)),
						children: [formatPct(asset.change24h), " 24h"]
					})
				]
			}, asset.id);
		})
	});
}
function Skeleton({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("rounded-md bg-elevated shimmer", className) });
}
function Dashboard({ initial }) {
	const [asset, setAsset] = (0, import_react.useState)(initial?.selected ?? "btc");
	const [window, setWindow] = (0, import_react.useState)(initial?.window ?? "1h");
	const [overridePosts, setOverridePosts] = (0, import_react.useState)(null);
	const query = useQuery({
		queryKey: [
			"snapshot",
			asset,
			window
		],
		queryFn: () => getSnapshot({ data: {
			asset,
			window
		} }),
		initialData: initial && asset === initial.selected && window === initial.window ? initial : void 0
	});
	const snapshot = query.data;
	const posts = (0, import_react.useMemo)(() => {
		if (overridePosts) return overridePosts;
		return snapshot?.posts ?? [];
	}, [overridePosts, snapshot?.posts]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
				source: snapshot?.sources.prices ?? "fallback",
				generatedAt: snapshot?.generatedAt ?? null
			}),
			snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ticker, {
				assets: snapshot.assets,
				selected: asset,
				onSelect: (id) => {
					setAsset(id);
					setOverridePosts(null);
				}
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-3 sm:px-6 lg:grid-cols-6",
				children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 rounded-xl" }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]",
				children: [snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartPanel, {
					symbol: snapshot.assets.find((a) => a.id === asset)?.symbol ?? "BTC",
					series: snapshot.series,
					window,
					onWindow: (w) => {
						setWindow(w);
						setOverridePosts(null);
					}
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-80 rounded-2xl" }), snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignalRail, { snapshot }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-80 rounded-2xl" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostFeed, {
					posts,
					onRescore: (next) => setOverridePosts(next)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertLog, { alerts: snapshot?.alerts ?? [] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "border-t border-border px-4 py-6 text-xs leading-relaxed text-subtle sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "SENTRA scores market voice with a financial lexicon (FinBERT-style), weights by reach, then correlates against live Binance / CoinGecko prints. Native X firehose attaches when API keys are present in the Python plane; this desk uses live news wires plus derived desk notes so the tape never goes dark." }), query.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-bear",
					children: query.error instanceof Error ? query.error.message : "Feed interrupted"
				}) : null]
			})
		]
	});
}
function Home() {
	const initial = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, { initial });
}
//#endregion
export { Home as component };
