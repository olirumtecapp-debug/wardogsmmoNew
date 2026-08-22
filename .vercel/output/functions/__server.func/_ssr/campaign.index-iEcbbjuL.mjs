import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as MISSIONS, f as isUnlocked, p as loadProgress, y as SCENARIOS } from "./router-Cj15J_rU.mjs";
import { d as Lock, o as Star } from "../_libs/lucide-react.mjs";
import { t as OrientationGate } from "./OrientationGate-r8o6TXBF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaign.index-iEcbbjuL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var wardogs_keyart_menu_png_asset_default = {
	version: 1,
	asset_id: "e835d975-5610-4ea7-b2ea-7b2b727da010",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/e835d975-5610-4ea7-b2ea-7b2b727da010/wardogs-keyart-menu.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/e835d975-5610-4ea7-b2ea-7b2b727da010/wardogs-keyart-menu.png",
	original_filename: "wardogs-keyart-menu.png",
	size: 2067843,
	content_type: "image/png",
	created_at: "2026-07-20T14:49:16Z"
};
var DIFF_LABEL = {
	recruit: {
		label: "Recruta",
		color: "var(--team-green)"
	},
	sergeant: {
		label: "Sargento",
		color: "var(--accent)"
	},
	general: {
		label: "General",
		color: "var(--team-red)"
	}
};
function CampaignMap() {
	const navigate = useNavigate();
	const [progress, setProgress] = (0, import_react.useState)(() => loadProgress());
	const totalStars = (0, import_react.useMemo)(() => Object.values(progress.stars).reduce((a, b) => a + b, 0), [progress]);
	const maxStars = MISSIONS.length * 3;
	const resetProgress = () => {
		if (!confirm("Zerar todo o progresso da campanha?")) return;
		try {
			localStorage.removeItem("wardogs.campaign.v1");
		} catch {}
		setProgress(loadProgress());
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrientationGate, {
		soft: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative min-h-dvh overflow-auto flex flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 -z-20",
					style: {
						backgroundImage: `url(${wardogs_keyart_menu_png_asset_default.url})`,
						backgroundSize: "cover",
						backgroundPosition: "center 30%",
						backgroundColor: "#0b0f16"
					},
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 -z-10",
					style: { background: "linear-gradient(180deg, rgba(6,9,14,0.88) 0%, rgba(6,9,14,0.75) 50%, rgba(6,9,14,0.96) 100%)" },
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center justify-between p-3 sm:p-5 gap-3 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
						children: "Campanha"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "stencil text-lg sm:text-2xl tracking-widest",
						children: "Operações WarDogs"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel px-2.5 py-1 flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
								size: 14,
								className: "fill-[color:var(--warn)] text-[color:var(--warn)]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "stencil text-xs",
								style: { color: "var(--warn)" },
								children: [
									totalStars,
									"/",
									maxStars
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "btn-hud text-[11px] px-2 py-1",
							children: "← Menu"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "flex-1 px-3 sm:px-6 pb-6 max-w-4xl w-full mx-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
						children: MISSIONS.map((m) => {
							const unlocked = isUnlocked(m, progress);
							const stars = progress.stars[m.id] ?? 0;
							const scenario = SCENARIOS.find((s) => s.id === m.scenario);
							const diff = DIFF_LABEL[m.difficulty];
							const accent = m.bonus ? "var(--warn)" : diff.color;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								disabled: !unlocked,
								onClick: () => navigate({
									to: "/campaign/$missionId",
									params: { missionId: m.id }
								}),
								className: `panel p-3 flex gap-3 text-left transition-all ${unlocked ? "hover:-translate-y-0.5 hover:shadow-2xl" : "opacity-50 cursor-not-allowed"}`,
								style: {
									borderColor: accent,
									boxShadow: unlocked ? `inset 0 0 0 1px ${accent}44, 0 0 12px ${accent}22` : void 0
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "w-20 h-20 rounded shrink-0 overflow-hidden relative",
									style: {
										backgroundImage: `url(${scenario.bgImage})`,
										backgroundSize: "cover",
										backgroundPosition: "center",
										boxShadow: `inset 0 0 0 1px ${accent}66`
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/30" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute top-1 left-1 stencil text-[10px] px-1 rounded bg-black/70",
											style: { color: accent },
											children: m.bonus ? "★" : m.index
										}),
										!unlocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute inset-0 flex items-center justify-center bg-black/60",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
												size: 22,
												className: "text-muted-foreground"
											})
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0 flex flex-col gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "stencil text-sm uppercase tracking-widest truncate",
												style: { color: accent },
												children: m.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex gap-0.5 shrink-0",
												children: [
													1,
													2,
													3
												].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
													size: 13,
													className: i <= stars ? "fill-[color:var(--warn)] text-[color:var(--warn)]" : "text-muted-foreground/40"
												}, i))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground line-clamp-2 leading-tight",
											children: m.brief
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground mt-auto",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: scenario.label }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													style: { color: diff.color },
													children: diff.label
												}),
												m.bonus && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													style: { color: "var(--warn)" },
													children: "Bônus"
												})] })
											]
										})
									]
								})]
							}, m.id);
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn-hud text-[10px] px-3 py-1 opacity-70 hover:opacity-100",
							onClick: resetProgress,
							children: "Zerar progresso"
						})
					})]
				})
			]
		})
	});
}
//#endregion
export { CampaignMap as component };
