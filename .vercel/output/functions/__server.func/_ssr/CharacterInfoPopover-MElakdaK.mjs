import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { l as require_react_dom } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as characterBars, t as CHARACTERS } from "./characters-DgQbMrji.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/CharacterInfoPopover-MElakdaK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var STAT_META = [
	{
		key: "hp",
		icon: "♥",
		label: "Vida"
	},
	{
		key: "mob",
		icon: "⚡",
		label: "Mobilidade"
	},
	{
		key: "jump",
		icon: "▲",
		label: "Pulo"
	},
	{
		key: "def",
		icon: "◆",
		label: "Defesa"
	}
];
var POPOVER_W = 224;
var GUTTER = 12;
function CharacterInfoPopover({ charId, children, placement = "top" }) {
	const c = CHARACTERS[charId];
	const bars = characterBars(charId);
	const color = c.skin.teamColor;
	const [open, setOpen] = (0, import_react.useState)(false);
	const [coords, setCoords] = (0, import_react.useState)(null);
	const [measured, setMeasured] = (0, import_react.useState)(false);
	const triggerRef = (0, import_react.useRef)(null);
	const popRef = (0, import_react.useRef)(null);
	const lpTimer = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => () => {
		if (lpTimer.current) window.clearTimeout(lpTimer.current);
	}, []);
	const compute = () => {
		const el = triggerRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const clientW = document.documentElement.clientWidth || window.innerWidth;
		const clientH = document.documentElement.clientHeight || window.innerHeight;
		const maxW = Math.min(POPOVER_W, clientW - 24);
		const popRect = popRef.current?.getBoundingClientRect();
		const w = popRect?.width ? Math.min(popRect.width, maxW) : maxW;
		const h = popRect?.height ?? 180;
		const spaceTop = r.top;
		const spaceBottom = clientH - r.bottom;
		const top = (placement === "top" ? spaceTop < h + GUTTER && spaceBottom > spaceTop : spaceBottom >= h + GUTTER || spaceBottom > spaceTop) ? Math.min(clientH - h - GUTTER, r.bottom + 6) : Math.max(GUTTER, r.top - h - 6);
		const centerX = r.left + r.width / 2 - w / 2;
		const left = Math.max(GUTTER, Math.min(centerX, clientW - w - GUTTER));
		setCoords({
			left,
			top
		});
		if (popRect) setMeasured(true);
	};
	(0, import_react.useLayoutEffect)(() => {
		if (!open) {
			setMeasured(false);
			return;
		}
		compute();
		const raf = requestAnimationFrame(() => compute());
		const onScroll = () => compute();
		window.addEventListener("scroll", onScroll, true);
		window.addEventListener("resize", onScroll);
		let ro = null;
		if (popRef.current && typeof ResizeObserver !== "undefined") {
			ro = new ResizeObserver(() => compute());
			ro.observe(popRef.current);
		}
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("scroll", onScroll, true);
			window.removeEventListener("resize", onScroll);
			ro?.disconnect();
		};
	}, [open]);
	const clearLp = () => {
		if (lpTimer.current) {
			window.clearTimeout(lpTimer.current);
			lpTimer.current = null;
		}
	};
	const onTouchStart = () => {
		clearLp();
		lpTimer.current = window.setTimeout(() => setOpen(true), 380);
	};
	const onTouchEnd = () => {
		clearLp();
		window.setTimeout(() => setOpen(false), 2200);
	};
	const clientW = typeof document !== "undefined" ? document.documentElement.clientWidth || window.innerWidth : 248;
	const width = Math.min(POPOVER_W, clientW - 24);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: triggerRef,
		className: "relative",
		onMouseEnter: () => setOpen(true),
		onMouseLeave: () => setOpen(false),
		onTouchStart,
		onTouchEnd,
		onTouchCancel: onTouchEnd,
		children: [children, open && coords && typeof document !== "undefined" && (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: popRef,
			className: "pointer-events-none fixed z-[100]",
			style: {
				left: coords.left,
				top: coords.top,
				width,
				visibility: measured ? "visible" : "hidden"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel p-2 text-left shadow-xl card-in overflow-hidden",
				style: {
					borderColor: color,
					boxShadow: `0 6px 20px rgba(0,0,0,0.6), 0 0 0 1px ${color}88`
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 mb-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "stencil text-[11px] uppercase tracking-widest truncate min-w-0",
							style: { color },
							children: c.name
						}), c.tier === "elite" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[7px] uppercase tracking-[0.15em] px-1 rounded font-bold shrink-0",
							style: {
								color: "#0b0f16",
								background: color
							},
							children: "Elite"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] uppercase tracking-widest text-muted-foreground mb-1 truncate",
						children: c.breed
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-foreground/80 leading-tight mb-1.5 break-words line-clamp-3",
						children: c.tagline
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-0.5",
						children: STAT_META.map((s) => {
							const pct = Math.round(bars[s.key] * 100);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 text-[9px] min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-3 text-center shrink-0",
										style: { color },
										children: s.icon
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-14 uppercase tracking-widest text-muted-foreground shrink-0 truncate",
										children: s.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex-1 min-w-0 h-1 rounded-full bg-black/50 overflow-hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full rounded-full",
											style: {
												width: `${pct}%`,
												background: color
											}
										})
									})
								]
							}, s.key);
						})
					})
				]
			})
		}), document.body)]
	});
}
//#endregion
export { CharacterInfoPopover as t };
