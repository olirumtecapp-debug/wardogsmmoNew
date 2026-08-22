import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/OrientationGate-r8o6TXBF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OrientationGate({ children, soft = false }) {
	const [portrait, setPortrait] = (0, import_react.useState)(false);
	const [dismissed, setDismissed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const check = () => {
			const isMobile = window.matchMedia("(pointer: coarse)").matches;
			const isPortrait = window.innerHeight > window.innerWidth;
			setPortrait(isMobile && isPortrait);
		};
		check();
		window.addEventListener("resize", check);
		window.addEventListener("orientationchange", check);
		return () => {
			window.removeEventListener("resize", check);
			window.removeEventListener("orientationchange", check);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [children, portrait && !(soft && dismissed) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: soft ? "fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none" : "fixed inset-0 z-[100] bg-[#050810]/97 backdrop-blur-xl flex items-center justify-center p-6 text-center",
		children: soft ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel p-3 pr-2 flex items-center gap-3 pointer-events-auto max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-2xl animate-pulse shrink-0",
					children: "📱↻"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "stencil text-sm",
						children: "Gire o dispositivo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground leading-tight",
						children: "Melhor experiência em modo paisagem."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setDismissed(true),
					className: "btn-hud btn-hud-ghost !px-2 !py-1 text-xs shrink-0",
					"aria-label": "Dispensar",
					children: "✕"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel p-8 max-w-sm text-center relative overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 opacity-20 pointer-events-none",
					style: { background: "radial-gradient(circle at 50% 40%, var(--accent) 0%, transparent 60%)" }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-center mb-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-6xl",
								style: {
									animation: "wd-rotate-hint 2.4s ease-in-out infinite",
									transformOrigin: "center",
									display: "inline-block"
								},
								"aria-hidden": true,
								children: "📱"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "stencil text-2xl tracking-widest mb-2",
							style: { color: "var(--accent)" },
							children: "GIRE O DISPOSITIVO"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted-foreground leading-relaxed mb-3",
							children: [
								"O WarDogs é jogado em ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-white",
									children: "modo paisagem"
								}),
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Vire seu celular na horizontal para começar a batalha."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-5 stencil text-[10px] tracking-[0.3em] text-muted-foreground/70",
							children: "↻ AGUARDANDO ROTAÇÃO"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `@keyframes wd-rotate-hint {
                0%,15% { transform: rotate(0deg); }
                45%,60% { transform: rotate(-90deg); }
                90%,100% { transform: rotate(0deg); }
              }` })
			]
		})
	})] });
}
//#endregion
export { OrientationGate as t };
