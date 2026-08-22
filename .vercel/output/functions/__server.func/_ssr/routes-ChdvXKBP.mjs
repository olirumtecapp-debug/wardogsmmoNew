import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as characterUnlockHint, b as getActiveScenario, s as isCharacterUnlocked, v as useScenario } from "./router-Cj15J_rU.mjs";
import { n as CHARACTER_LIST, t as CHARACTERS } from "./characters-DgQbMrji.mjs";
import { t as X } from "../_libs/lucide-react.mjs";
import { c as WarDogsGame, d as audio, n as AudioSettingsPanel, r as ComicIntro, x as shouldSkipIntro } from "./ComicIntro-CTorxFoe.mjs";
import { t as OrientationGate } from "./OrientationGate-r8o6TXBF.mjs";
import { t as CharacterInfoPopover } from "./CharacterInfoPopover-MElakdaK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-ChdvXKBP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SupportPixDialog() {
	return null;
}
/**
* Animated background for the WarDogs main menu.
* Renders a dusk sky, parallax ruins, patrolling dog silhouettes,
* arcing projectiles with tiny explosions, and rising smoke plumes.
* Pauses while the tab is hidden.
*/
function MenuBackdrop() {
	const canvasRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let w = 0, h = 0, dpr = 1;
		let raf = 0;
		let running = true;
		const resize = () => {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			if (window.innerWidth < 640) dpr = Math.min(dpr, 1.25);
			w = canvas.clientWidth;
			h = canvas.clientHeight;
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		resize();
		window.addEventListener("resize", resize);
		const stars = Array.from({ length: 60 }, () => ({
			x: Math.random(),
			y: Math.random() * .55,
			r: Math.random() * 1.2 + .3,
			tw: Math.random() * Math.PI * 2
		}));
		const projectiles = [];
		const explosions = [];
		const smokes = [];
		let lastShot = 0;
		let lastSmoke = 0;
		const dogWalkers = [
			{
				x: .1,
				speed: 12,
				y: .78,
				facing: 1
			},
			{
				x: .6,
				speed: 8,
				y: .82,
				facing: -1
			},
			{
				x: .35,
				speed: 10,
				y: .76,
				facing: 1
			}
		];
		const drawMountain = (yBase, amp, color, seed, offset) => {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.moveTo(0, h);
			const step = 40;
			for (let x = -offset % step; x <= w + step; x += step) {
				const n = Math.sin((x + seed) * .008) * .6 + Math.sin((x + seed) * .021) * .4;
				ctx.lineTo(x, yBase + n * amp);
			}
			ctx.lineTo(w, h);
			ctx.closePath();
			ctx.fill();
		};
		const drawDogSilhouette = (x, y, facing, t) => {
			ctx.save();
			ctx.translate(x, y);
			ctx.scale(facing, 1);
			ctx.fillStyle = "rgba(6,10,14,0.9)";
			ctx.beginPath();
			ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(7, -3, 3, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.moveTo(6, -6);
			ctx.lineTo(7, -8);
			ctx.lineTo(8.5, -5.5);
			ctx.closePath();
			ctx.fill();
			const wag = Math.sin(t * .008) * 1.5;
			ctx.beginPath();
			ctx.moveTo(-7, -1);
			ctx.lineTo(-11, -4 + wag);
			ctx.lineTo(-10, -1);
			ctx.closePath();
			ctx.fill();
			const g = Math.sin(t * .012) * 1.5;
			ctx.fillRect(-5, 2, 1.6, 4 + g);
			ctx.fillRect(-2, 2, 1.6, 4 - g);
			ctx.fillRect(2, 2, 1.6, 4 + g);
			ctx.fillRect(5, 2, 1.6, 4 - g);
			ctx.beginPath();
			ctx.ellipse(7, -5, 3.4, 1.8, 0, Math.PI, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		};
		let last = performance.now();
		const frame = (now) => {
			if (!running) return;
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const skyShift = (Math.sin(now * 8e-5) + 1) * .5;
			const sky = ctx.createLinearGradient(0, 0, 0, h);
			sky.addColorStop(0, `oklch(0.16 0.04 ${260 + skyShift * 20})`);
			sky.addColorStop(.55, `oklch(0.26 0.10 ${40 + skyShift * 20})`);
			sky.addColorStop(.85, `oklch(0.20 0.08 30)`);
			sky.addColorStop(1, `oklch(0.10 0.02 250)`);
			ctx.fillStyle = sky;
			ctx.fillRect(0, 0, w, h);
			const moonX = w * .82, moonY = h * .18;
			const moonG = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 80);
			moonG.addColorStop(0, "rgba(255,240,210,0.9)");
			moonG.addColorStop(.15, "rgba(255,230,190,0.35)");
			moonG.addColorStop(1, "rgba(255,220,180,0)");
			ctx.fillStyle = moonG;
			ctx.fillRect(moonX - 100, moonY - 100, 200, 200);
			ctx.fillStyle = "rgba(255,240,215,0.95)";
			ctx.beginPath();
			ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
			ctx.fill();
			for (const s of stars) {
				s.tw += dt * 2;
				const a = .4 + (Math.sin(s.tw) + 1) * .3;
				ctx.fillStyle = `rgba(240,240,220,${a})`;
				ctx.beginPath();
				ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
				ctx.fill();
			}
			const sunG = ctx.createRadialGradient(w * .15, h * .55, 0, w * .15, h * .55, w * .4);
			sunG.addColorStop(0, "rgba(255,150,60,0.35)");
			sunG.addColorStop(1, "rgba(255,120,40,0)");
			ctx.fillStyle = sunG;
			ctx.fillRect(0, 0, w, h);
			const drift = now * .005;
			drawMountain(h * .62, 30, "rgba(12,18,26,0.75)", 100, drift * .6);
			drawMountain(h * .72, 22, "rgba(10,14,22,0.9)", 300, drift);
			drawMountain(h * .82, 16, "rgba(6,10,16,1)", 550, drift * 1.6);
			ctx.fillStyle = "rgba(4,6,10,1)";
			for (let i = 0; i < 8; i++) {
				const rx = i * w / 8 + drift * 1.6 % (w / 8) - 40;
				const rh = 20 + i * 37 % 30;
				ctx.fillRect(rx, h * .82 - rh, 14, rh);
				ctx.fillRect(rx + 20, h * .82 - rh * .6, 10, rh * .6);
			}
			for (const d of dogWalkers) {
				d.x += d.speed * dt / w * d.facing;
				if (d.x > 1.1) d.x = -.1;
				if (d.x < -.1) d.x = 1.1;
				drawDogSilhouette(d.x * w, d.y * h, d.facing, now);
			}
			if (now - lastShot > 1400 + Math.random() * 1200) {
				lastShot = now;
				const fromLeft = Math.random() < .5;
				const x0 = fromLeft ? -20 : w + 20;
				const y0 = h * (.55 + Math.random() * .15);
				const targetX = fromLeft ? w * (.4 + Math.random() * .4) : w * (.2 + Math.random() * .4);
				const targetY = h * (.7 + Math.random() * .1);
				const t = 2.2 + Math.random() * .6;
				const g = 260;
				const vx = (targetX - x0) / t;
				const vy = (targetY - y0 - .5 * g * t * t) / t;
				projectiles.push({
					x: x0,
					y: y0,
					vx,
					vy,
					trail: [],
					color: Math.random() < .5 ? "#ff8c1a" : "#7dd66a"
				});
			}
			for (let i = projectiles.length - 1; i >= 0; i--) {
				const p = projectiles[i];
				p.vy += 260 * dt;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.trail.push([p.x, p.y]);
				if (p.trail.length > 22) p.trail.shift();
				for (let k = 0; k < p.trail.length; k++) {
					const a = k / p.trail.length;
					ctx.globalAlpha = a * .7;
					ctx.fillStyle = p.color;
					ctx.beginPath();
					ctx.arc(p.trail[k][0], p.trail[k][1], 1 + a * 2, 0, Math.PI * 2);
					ctx.fill();
				}
				ctx.globalAlpha = 1;
				ctx.fillStyle = "#fff";
				ctx.shadowColor = p.color;
				ctx.shadowBlur = 10;
				ctx.beginPath();
				ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
				ctx.fill();
				ctx.shadowBlur = 0;
				if (p.y >= h * .83 || p.x < -60 || p.x > w + 60) {
					explosions.push({
						x: p.x,
						y: Math.min(p.y, h * .83),
						age: 0,
						max: .7,
						r: 22 + Math.random() * 14
					});
					smokes.push({
						x: p.x,
						y: h * .83,
						r: 4,
						life: 3
					});
					projectiles.splice(i, 1);
				}
			}
			for (let i = explosions.length - 1; i >= 0; i--) {
				const e = explosions[i];
				e.age += dt;
				const t2 = e.age / e.max;
				if (t2 >= 1) {
					explosions.splice(i, 1);
					continue;
				}
				const r = e.r * (.4 + t2 * 1.2);
				const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
				g.addColorStop(0, `rgba(255,240,180,${(1 - t2) * .9})`);
				g.addColorStop(.5, `rgba(255,140,40,${(1 - t2) * .7})`);
				g.addColorStop(1, "rgba(255,80,20,0)");
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
				ctx.fill();
			}
			if (now - lastSmoke > 400) {
				lastSmoke = now;
				smokes.push({
					x: Math.random() * w,
					y: h * .83,
					r: 3 + Math.random() * 3,
					life: 4 + Math.random() * 3
				});
			}
			for (let i = smokes.length - 1; i >= 0; i--) {
				const s = smokes[i];
				s.life -= dt;
				s.y -= 12 * dt;
				s.r += 6 * dt;
				if (s.life <= 0) {
					smokes.splice(i, 1);
					continue;
				}
				ctx.globalAlpha = Math.max(0, s.life / 5) * .35;
				ctx.fillStyle = "rgba(60,60,70,1)";
				ctx.beginPath();
				ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.globalAlpha = 1;
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		const onVis = () => {
			if (document.hidden) {
				running = false;
				cancelAnimationFrame(raf);
			} else if (!running) {
				running = true;
				last = performance.now();
				raf = requestAnimationFrame(frame);
			}
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			running = false;
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		"aria-hidden": true,
		className: "absolute inset-0 w-full h-full pointer-events-none"
	});
}
var DIFF_INFO = [
	{
		id: "recruit",
		label: "Recruta",
		desc: "Distraído, erros frequentes",
		color: "var(--team-green)"
	},
	{
		id: "sergeant",
		label: "Sargento",
		desc: "Equilibrado, mira decente",
		color: "var(--accent)"
	},
	{
		id: "general",
		label: "General",
		desc: "Preciso, aproveita cada abertura",
		color: "var(--team-red)"
	}
];
function CharCard({ charId, active, onSelect, locked, lockHint }) {
	const c = CHARACTERS[charId];
	const color = c.skin.teamColor;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CharacterInfoPopover, {
		charId,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => {
				if (!locked) onSelect();
			},
			disabled: locked,
			className: `btn-hud p-1.5 flex flex-col gap-1 items-center text-center w-full relative ${active ? "is-selected" : ""} ${locked ? "opacity-60 cursor-not-allowed" : ""}`,
			style: active ? {
				borderColor: color,
				boxShadow: `inset 0 0 0 1px ${color}, 0 0 12px ${color}88`
			} : void 0,
			title: locked ? lockHint : `${c.name} — ${c.tagline}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative w-full aspect-square rounded bg-black/40 overflow-hidden",
				style: { boxShadow: `0 0 6px ${color}` },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: c.portraitUrl,
					alt: c.name,
					className: `absolute inset-0 w-full h-full object-contain ${locked ? "grayscale" : ""}`,
					style: {
						transform: `scale(${c.sizing.portraitScale})`,
						transformOrigin: "bottom center"
					}
				}), locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 flex items-center justify-center bg-black/50 rounded",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xl",
						"aria-hidden": true,
						children: "🔒"
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 justify-center w-full min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stencil text-[11px] uppercase tracking-widest truncate",
					style: { color },
					children: c.name
				}), c.tier === "elite" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[7px] uppercase tracking-[0.15em] px-1 rounded font-bold shrink-0",
					style: {
						color: "#0b0f16",
						background: color
					},
					children: "E"
				})]
			})]
		})
	});
}
function SummaryCard({ label, title, subtitle, thumb, color, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "btn-hud p-2.5 flex items-center gap-3 text-left",
		style: {
			borderColor: color,
			boxShadow: `inset 0 0 0 1px ${color}55, 0 0 10px ${color}33`
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-14 h-14 rounded overflow-hidden shrink-0 bg-black/40 flex items-center justify-center",
				style: { boxShadow: `0 0 6px ${color}66` },
				children: thumb
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] uppercase tracking-[0.25em] text-muted-foreground",
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "stencil text-[13px] uppercase tracking-widest truncate",
						style: { color },
						children: title
					}),
					subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] text-muted-foreground truncate",
						children: subtitle
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] uppercase tracking-widest text-muted-foreground shrink-0",
				children: "Trocar ▸"
			})
		]
	});
}
function PickerModal({ title, onClose, children }) {
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm card-in",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel w-full max-w-3xl max-h-[85vh] overflow-auto p-4",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stencil text-sm uppercase tracking-widest",
					style: { color: "var(--accent)" },
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn-hud text-[11px] px-2 py-1",
					onClick: onClose,
					children: "✕ Fechar"
				})]
			}), children]
		})
	});
}
var DURATION_OPTIONS = [
	{
		value: 180,
		label: "3 min",
		desc: "Combate rápido"
	},
	{
		value: 300,
		label: "5 min",
		desc: "Padrão equilibrado"
	},
	{
		value: 480,
		label: "8 min",
		desc: "Duelo prolongado"
	},
	{
		value: 0,
		label: "Sem limite",
		desc: "Vale o último dog em pé"
	}
];
function PreMatchBriefing({ mode, onStart, onBack }) {
	const { scenario, setScenario, scenarios, difficulty, setDifficulty } = useScenario();
	const [scenarioSel, setScenarioSel] = (0, import_react.useState)(scenario.id);
	const [diffSel, setDiffSel] = (0, import_react.useState)(difficulty);
	const [p1, setP1] = (0, import_react.useState)("ranger");
	const [p2, setP2] = (0, import_react.useState)("brutus");
	const [duration, setDuration] = (0, import_react.useState)(300);
	const [picker, setPicker] = (0, import_react.useState)(null);
	const currentScenario = scenarios.find((s) => s.id === scenarioSel) ?? scenarios[0];
	const currentDiff = DIFF_INFO.find((d) => d.id === diffSel);
	const c1 = CHARACTERS[p1];
	const c2 = CHARACTERS[p2];
	const handleStart = () => {
		setScenario(scenarioSel);
		if (mode === "ai") setDifficulty(diffSel);
		onStart([p1, p2], duration);
	};
	const close = () => setPicker(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 overflow-auto bg-[#0b0f16]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-dvh flex flex-col p-3 sm:p-4 gap-3 max-w-3xl mx-auto w-full",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex items-center justify-between gap-3 shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
							children: "Briefing"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "stencil text-lg sm:text-xl tracking-widest",
							children: mode === "ai" ? "Missão vs IA" : "Duelo Hotseat"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn-hud text-[11px] px-2 py-1",
							onClick: onBack,
							children: "← Voltar"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel p-3 card-in",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2",
							children: "Toque em cada item para escolher"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
									label: "Cenário",
									title: currentScenario.label,
									subtitle: currentScenario.description,
									color: currentScenario.sky[2],
									thumb: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-full h-full",
										style: {
											backgroundImage: `url(${currentScenario.bgImage})`,
											backgroundSize: "cover",
											backgroundPosition: "center"
										}
									}),
									onClick: () => setPicker("scenario")
								}),
								mode === "ai" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
									label: "Dificuldade da IA",
									title: currentDiff.label,
									subtitle: currentDiff.desc,
									color: currentDiff.color,
									thumb: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "stencil text-lg",
										style: { color: currentDiff.color },
										children: "★"
									}),
									onClick: () => setPicker("difficulty")
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "btn-hud p-2.5 flex items-center gap-3 opacity-60",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-14 h-14 rounded bg-black/40 flex items-center justify-center stencil text-lg",
										children: "2P"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[9px] uppercase tracking-[0.25em] text-muted-foreground",
												children: "Modo"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "stencil text-[13px] uppercase tracking-widest",
												children: "Hotseat"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[9px] text-muted-foreground",
												children: "Dois jogadores, mesmo dispositivo"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
									label: "Jogador 1",
									title: c1.name,
									subtitle: `${c1.breed} — ${c1.tagline}`,
									color: c1.skin.teamColor,
									thumb: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: c1.portraitUrl,
										alt: c1.name,
										className: "w-full h-full object-contain",
										style: {
											transform: `scale(${c1.sizing.portraitScale})`,
											transformOrigin: "bottom center"
										}
									}),
									onClick: () => setPicker("p1")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
									label: mode === "ai" ? "IA (Jogador 2)" : "Jogador 2",
									title: c2.name,
									subtitle: `${c2.breed} — ${c2.tagline}`,
									color: c2.skin.teamColor,
									thumb: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: c2.portraitUrl,
										alt: c2.name,
										className: "w-full h-full object-contain",
										style: {
											transform: `scale(${c2.sizing.portraitScale})`,
											transformOrigin: "bottom center"
										}
									}),
									onClick: () => setPicker("p2")
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2",
								children: "Duração da partida"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 sm:grid-cols-4 gap-1.5",
								children: DURATION_OPTIONS.map((o) => {
									const active = duration === o.value;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => setDuration(o.value),
										className: `btn-hud px-2 py-1.5 text-left ${active ? "is-selected" : ""}`,
										style: active ? {
											borderColor: "var(--accent)",
											boxShadow: "inset 0 0 0 1px var(--accent), 0 0 10px var(--accent)"
										} : void 0,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "stencil text-[12px] tracking-widest",
											children: o.label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[9px] text-muted-foreground leading-tight",
											children: o.desc
										})]
									}, o.value);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] text-muted-foreground mt-1.5",
								children: "Quando o tempo zera, vence quem tiver mais HP."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto flex flex-col sm:flex-row gap-2 pt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn-hud flex-1 py-3 text-[12px]",
							onClick: onBack,
							children: "Cancelar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn-hud is-selected flex-[2] py-3 stencil text-base tracking-widest",
							onClick: handleStart,
							style: {
								borderColor: "var(--accent)",
								boxShadow: "inset 0 0 0 1px var(--accent), 0 0 20px var(--accent)"
							},
							children: "Iniciar Partida ▸"
						})]
					})
				]
			}),
			picker === "scenario" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickerModal, {
				title: "Escolher Cenário",
				onClose: close,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 sm:grid-cols-4 gap-2",
					children: scenarios.map((sc) => {
						const active = sc.id === scenarioSel;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								setScenarioSel(sc.id);
								close();
							},
							className: `btn-hud p-2 flex flex-col items-stretch gap-1 text-left ${active ? "is-selected" : ""}`,
							style: active ? {
								borderColor: sc.sky[2],
								boxShadow: `inset 0 0 0 1px ${sc.sky[2]}, 0 0 14px ${sc.sky[2]}88`
							} : void 0,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-full h-20 rounded overflow-hidden",
									style: {
										backgroundImage: `url(${sc.bgImage})`,
										backgroundSize: "cover",
										backgroundPosition: "center",
										boxShadow: "inset 0 -6px 10px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)"
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stencil text-[11px] uppercase tracking-widest",
									children: sc.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] text-muted-foreground leading-tight line-clamp-2",
									children: sc.description
								})
							]
						}, sc.id);
					})
				})
			}),
			picker === "difficulty" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickerModal, {
				title: "Escolher Dificuldade",
				onClose: close,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 sm:grid-cols-3 gap-2",
					children: DIFF_INFO.map((d) => {
						const active = d.id === diffSel;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								setDiffSel(d.id);
								close();
							},
							className: `btn-hud p-3 flex flex-col items-start gap-1 text-left ${active ? "is-selected" : ""}`,
							style: active ? {
								borderColor: d.color,
								boxShadow: `inset 0 0 0 1px ${d.color}, 0 0 12px ${d.color}`
							} : void 0,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "stencil text-sm uppercase tracking-widest",
								style: { color: d.color },
								children: d.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-muted-foreground leading-tight",
								children: d.desc
							})]
						}, d.id);
					})
				})
			}),
			picker === "p1" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PickerModal, {
				title: "Escolher Jogador 1",
				onClose: close,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-muted-foreground mb-2",
					children: "Personagens de elite (Corso, Miu, Bartô) são desbloqueados concluindo missões da Campanha."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-4 sm:grid-cols-7 gap-1.5",
					children: CHARACTER_LIST.map((c) => {
						const locked = !isCharacterUnlocked(c.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CharCard, {
							charId: c.id,
							active: p1 === c.id,
							locked,
							lockHint: characterUnlockHint(c.id),
							onSelect: () => {
								setP1(c.id);
								close();
							}
						}, `p1-${c.id}`);
					})
				})]
			}),
			picker === "p2" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PickerModal, {
				title: mode === "ai" ? "Escolher IA" : "Escolher Jogador 2",
				onClose: close,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-muted-foreground mb-2",
					children: "Personagens de elite (Corso, Miu, Bartô) são desbloqueados concluindo missões da Campanha."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-4 sm:grid-cols-7 gap-1.5",
					children: CHARACTER_LIST.map((c) => {
						const locked = !isCharacterUnlocked(c.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CharCard, {
							charId: c.id,
							active: p2 === c.id,
							locked,
							lockHint: characterUnlockHint(c.id),
							onSelect: () => {
								setP2(c.id);
								close();
							}
						}, `p2-${c.id}`);
					})
				})]
			})
		]
	});
}
function getFsElement() {
	const d = document;
	return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}
function isMobileDevice() {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(pointer: coarse)").matches;
}
function fullscreenSupported() {
	if (typeof document === "undefined") return false;
	const el = document.documentElement;
	return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}
async function requestFullscreenNow() {
	if (typeof document === "undefined") return false;
	const el = document.documentElement;
	try {
		if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
		else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
		else return false;
		const orient = screen.orientation;
		if (orient?.lock) try {
			await orient.lock("landscape");
		} catch {}
		return true;
	} catch {
		return false;
	}
}
async function exitFullscreenNow() {
	const d = document;
	try {
		if (d.exitFullscreen) await d.exitFullscreen();
		else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
	} catch {}
}
function useFullscreen() {
	const [isFullscreen, setIsFullscreen] = (0, import_react.useState)(() => !!getFsElement());
	(0, import_react.useEffect)(() => {
		const onChange = () => setIsFullscreen(!!getFsElement());
		document.addEventListener("fullscreenchange", onChange);
		document.addEventListener("webkitfullscreenchange", onChange);
		return () => {
			document.removeEventListener("fullscreenchange", onChange);
			document.removeEventListener("webkitfullscreenchange", onChange);
		};
	}, []);
	return {
		isFullscreen,
		request: (0, import_react.useCallback)(() => requestFullscreenNow(), []),
		exit: (0, import_react.useCallback)(() => exitFullscreenNow(), []),
		supported: fullscreenSupported(),
		isMobile: isMobileDevice()
	};
}
var wardogs_logo_png_asset_default = {
	version: 1,
	asset_id: "62b49b36-8356-4999-abe9-16269327d2fb",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/62b49b36-8356-4999-abe9-16269327d2fb/wardogs-logo.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/62b49b36-8356-4999-abe9-16269327d2fb/wardogs-logo.png",
	original_filename: "wardogs-logo.png",
	size: 332059,
	content_type: "image/png",
	created_at: "2026-07-20T09:46:30Z"
};
var wardogs_menu_hero_v2_png_asset_default = {
	version: 1,
	asset_id: "686319cb-4bba-4507-b4a9-1a02255a4e30",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/686319cb-4bba-4507-b4a9-1a02255a4e30/wardogs-menu-hero-v2.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/686319cb-4bba-4507-b4a9-1a02255a4e30/wardogs-menu-hero-v2.png",
	original_filename: "wardogs-menu-hero-v2.png",
	size: 1927357,
	content_type: "image/png",
	created_at: "2026-07-22T01:33:16Z"
};
var logoImg = wardogs_logo_png_asset_default.url;
var bgImg = wardogs_menu_hero_v2_png_asset_default.url;
function Home() {
	const [stage, setStage] = (0, import_react.useState)({ kind: "menu" });
	const [showHowTo, setShowHowTo] = (0, import_react.useState)(false);
	const [showAudio, setShowAudio] = (0, import_react.useState)(false);
	const [showSupport, setShowSupport] = (0, import_react.useState)(false);
	const [muted, setMuted] = (0, import_react.useState)(() => audio.getSettings().muted);
	const navigate = useNavigate();
	const { isFullscreen, isMobile, supported: fsSupported } = useFullscreen();
	(0, import_react.useEffect)(() => {
		const kick = () => {
			audio.ensure();
			if (stage.kind === "menu") audio.playMusic("menu");
		};
		window.addEventListener("pointerdown", kick, { once: true });
		window.addEventListener("keydown", kick, { once: true });
		return () => {
			window.removeEventListener("pointerdown", kick);
			window.removeEventListener("keydown", kick);
		};
	}, [stage.kind]);
	(0, import_react.useEffect)(() => audio.subscribe((s) => setMuted(s.muted)), []);
	(0, import_react.useEffect)(() => {
		if (stage.kind === "menu") audio.playMusic("menu");
		else if (stage.kind === "playing") audio.playMusic("combat");
	}, [stage.kind]);
	(0, import_react.useEffect)(() => {
		if (!showHowTo) return;
		const onKey = (e) => e.key === "Escape" && setShowHowTo(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [showHowTo]);
	if (stage.kind === "playing") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrientationGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WarDogsGame, {
			mode: stage.mode,
			chars: stage.chars,
			matchDuration: stage.matchDuration,
			onExit: () => setStage({ kind: "menu" })
		})
	}) });
	if (stage.kind === "intro") {
		const sc = getActiveScenario();
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComicIntro, {
			chars: stage.chars,
			scenarioLabel: sc.label,
			bgImage: sc.bgImage,
			onDone: () => setStage({
				kind: "playing",
				mode: stage.mode,
				chars: stage.chars,
				matchDuration: stage.matchDuration
			})
		});
	}
	if (stage.kind === "briefing") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrientationGate, {
		soft: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreMatchBriefing, {
			mode: stage.mode,
			onStart: (chars, matchDuration) => {
				if (shouldSkipIntro()) setStage({
					kind: "playing",
					mode: stage.mode,
					chars,
					matchDuration
				});
				else setStage({
					kind: "intro",
					mode: stage.mode,
					chars,
					matchDuration
				});
			},
			onBack: () => setStage({ kind: "menu" })
		})
	});
	const pickMode = (mode) => {
		if (isMobile && fsSupported && !isFullscreen) requestFullscreenNow();
		setStage({
			kind: "briefing",
			mode
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrientationGate, {
		soft: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative min-h-dvh overflow-hidden flex flex-col safe-pad",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 -z-30",
					style: {
						backgroundImage: `url(${bgImg})`,
						backgroundSize: "cover",
						backgroundPosition: "center 30%",
						backgroundRepeat: "no-repeat",
						backgroundColor: "#0b0f16"
					},
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 -z-20 opacity-20 mix-blend-screen pointer-events-none",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuBackdrop, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 -z-10",
					style: { background: "linear-gradient(180deg, rgba(6,9,14,0.75) 0%, rgba(6,9,14,0.35) 35%, rgba(6,9,14,0.45) 65%, rgba(6,9,14,0.92) 100%)" },
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 -z-10 hero-vignette pointer-events-none",
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "p-3 sm:p-5 flex items-center justify-between relative gap-3 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: logoImg,
							alt: "WarDogs",
							className: "h-10 sm:h-14 w-auto object-contain float-slow drop-shadow-[0_0_22px_rgba(255,138,26,0.55)] shrink-0"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-w-0 hidden sm:block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.3em] truncate",
								children: "Artilharia canina · Squad até 4 · Online, IA & Hotseat"
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden md:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[color:var(--team-green)] badge-live" }), "Pelotão pronto"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "flex-1 flex flex-col items-center justify-between px-4 pb-3 gap-2 relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 min-h-0",
							"aria-hidden": true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full max-w-3xl grid gap-2 grid-cols-2 sm:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeCard, {
									title: "Campanha",
									subtitle: "Missões + estrelas",
									color: "var(--warn)",
									delay: 0,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarIcon, {}),
									onClick: () => navigate({ to: "/campaign" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeCard, {
									title: "vs IA",
									subtitle: "Contra o computador",
									color: "var(--team-green)",
									delay: 70,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TargetIcon, {}),
									onClick: () => pickMode("ai")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeCard, {
									title: "Hotseat",
									subtitle: "2 jogadores",
									color: "var(--accent)",
									delay: 140,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersusIcon, {}),
									onClick: () => pickMode("hotseat")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeCard, {
									title: "Online",
									subtitle: "Sala + código",
									color: "var(--team-red)",
									delay: 210,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlobeIcon, {}),
									onClick: () => navigate({ to: "/online" })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex items-center gap-2 flex-wrap justify-center" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stripe-warn h-2 opacity-70 shrink-0",
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
					className: "py-2 text-center text-[10px] text-muted-foreground uppercase tracking-[0.25em] shrink-0",
					children: "Segure firme o capacete · Ajuste o ângulo · Boa sorte, soldado"
				}),
				showHowTo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowToPlayModal, { onClose: () => setShowHowTo(false) }),
				showAudio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioSettingsPanel, { onClose: () => setShowAudio(false) }),
				showSupport && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupportPixDialog, { onClose: () => setShowSupport(false) })
			]
		})
	});
}
function HowToPlayModal({ onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm card-in",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel relative w-full max-w-lg p-5 max-h-[85dvh] overflow-y-auto",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "stencil text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]",
						children: "Como jogar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "btn-hud p-1.5",
						"aria-label": "Fechar",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[11px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShortcutRow, {
							label: "Ângulo",
							keys: ["←", "→"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShortcutRow, {
							label: "Força",
							keys: ["↑", "↓"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShortcutRow, {
							label: "Atirar",
							keys: ["Espaço"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShortcutRow, {
							label: "Mover",
							keys: ["A", "D"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShortcutRow, {
							label: "Pulo",
							keys: ["W"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShortcutRow, {
							label: "Arma",
							keys: [
								"1",
								"–",
								"8"
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 pt-3 border-t border-border/40 space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground uppercase tracking-widest text-center",
						children: "No celular · arraste do cachorro pra mirar e solte pra atirar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-[10px] text-[color:var(--accent)]/90 text-center",
						children: [
							"🌀 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Teletransporte:" }),
							" toque no mapa pra marcar o destino, depois toque na marca (ou em CONFIRMAR) pra reaparecer lá."
						]
					})]
				})
			]
		})
	});
}
function ModeCard({ title, subtitle, color, onClick, disabled, icon, delay }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: `panel p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl card-in ${disabled ? "opacity-60 hover:translate-y-0" : ""}`,
		style: {
			borderColor: color,
			animationDelay: `${delay}ms`
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "opacity-80 shrink-0",
				style: { color },
				children: icon
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stencil text-sm tracking-wider truncate",
					style: { color },
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[9px] text-muted-foreground uppercase tracking-widest truncate",
					children: subtitle
				})]
			})]
		})
	});
}
function ShortcutRow({ label, keys }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground uppercase tracking-wider text-[10px]",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex items-center gap-1",
			children: keys.map((k, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
				className: "min-w-[22px] px-1.5 py-0.5 text-center bg-secondary/80 border border-border/60 rounded text-[10px] font-mono shadow-inner",
				children: k
			}, i))
		})]
	});
}
function TargetIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "22",
		height: "22",
		viewBox: "0 0 36 36",
		fill: "none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "18",
				cy: "18",
				r: "14",
				stroke: "currentColor",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "18",
				cy: "18",
				r: "9",
				stroke: "currentColor",
				strokeWidth: "1.2",
				opacity: "0.7"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "18",
				cy: "18",
				r: "1.4",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M18 2v6M18 28v6M2 18h6M28 18h6",
				stroke: "currentColor",
				strokeWidth: "1.4"
			})
		]
	});
}
function VersusIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "24",
		height: "22",
		viewBox: "0 0 40 36",
		fill: "none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
				fill: "currentColor",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M2 22c0-5 4-9 9-9 2 0 3 .5 4 1l2-3 1 3c1 1 2 2 2 4v4c0 3-2 5-5 5H7c-3 0-5-2-5-5z",
					opacity: "0.85"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
				fill: "currentColor",
				transform: "translate(40 0) scale(-1 1)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M2 22c0-5 4-9 9-9 2 0 3 .5 4 1l2-3 1 3c1 1 2 2 2 4v4c0 3-2 5-5 5H7c-3 0-5-2-5-5z",
					opacity: "0.85"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: "20",
				y: "22",
				textAnchor: "middle",
				fontFamily: "Black Ops One, sans-serif",
				fontSize: "9",
				fill: "currentColor",
				children: "VS"
			})
		]
	});
}
function GlobeIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "22",
		height: "22",
		viewBox: "0 0 36 36",
		fill: "none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "18",
				cy: "18",
				r: "14",
				stroke: "currentColor",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "18",
				cy: "18",
				rx: "6",
				ry: "14",
				stroke: "currentColor",
				strokeWidth: "1.2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M4 18h28",
				stroke: "currentColor",
				strokeWidth: "1.2"
			})
		]
	});
}
function StarIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: "22",
		height: "22",
		viewBox: "0 0 36 36",
		fill: "none",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M18 3 L22.2 13.2 L33 14.2 L24.6 21.6 L27.2 32 L18 26.4 L8.8 32 L11.4 21.6 L3 14.2 L13.8 13.2 Z",
			fill: "currentColor",
			opacity: "0.9",
			stroke: "currentColor",
			strokeWidth: "1.2",
			strokeLinejoin: "round"
		})
	});
}
//#endregion
export { Home as component };
