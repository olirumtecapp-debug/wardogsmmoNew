import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react, t as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { _ as createFileRoute, d as HeadContent, f as useRouterState, g as lazyRouteComponent, h as Outlet, m as createRouter, u as Scripts, v as createRootRouteWithContext, x as useRouter, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as __exportAll } from "./server-jSUsUxQv.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scenarios-BRClPtwO.js
var SCENARIOS = [
	{
		id: "battlefield",
		label: "Zona de Guerra",
		description: "Operação Cerco Total — ruínas em chamas",
		bgImage: {
			version: 1,
			asset_id: "5660c414-15e6-44b6-9881-8296ebcabd16",
			project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
			url: "/__l5e/assets-v1/5660c414-15e6-44b6-9881-8296ebcabd16/bg-warzone.jpg",
			r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/5660c414-15e6-44b6-9881-8296ebcabd16/bg-warzone.jpg",
			original_filename: "bg-warzone.jpg",
			size: 333138,
			content_type: "image/jpeg",
			created_at: "2026-07-20T02:23:27Z"
		}.url,
		bgFocus: {
			x: .5,
			y: .4
		},
		sky: [
			"#0b1220",
			"#1b2b3a",
			"#3a3222",
			"#1a1408"
		],
		tint: "rgba(255,140,60,0.06)",
		tintBlend: "screen",
		particleColor: "#c9b78a",
		particleShape: "ember",
		windScale: 1,
		gravityScale: 1,
		terrainTop: [
			138,
			122,
			98
		],
		terrainMid: [
			90,
			74,
			56
		],
		terrainDeep: [
			42,
			32,
			20
		]
	},
	{
		id: "arctic",
		label: "Ártico",
		description: "Operação Gelo Negro — frente congelada",
		bgImage: {
			version: 1,
			asset_id: "14c57c92-e513-4b43-8cab-67be3cd7ddee",
			project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
			url: "/__l5e/assets-v1/14c57c92-e513-4b43-8cab-67be3cd7ddee/bg-arctic.jpg",
			r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/14c57c92-e513-4b43-8cab-67be3cd7ddee/bg-arctic.jpg",
			original_filename: "bg-arctic.jpg",
			size: 361480,
			content_type: "image/jpeg",
			created_at: "2026-07-20T02:23:16Z"
		}.url,
		bgFocus: {
			x: .5,
			y: .55
		},
		sky: [
			"#0a1a2a",
			"#26466a",
			"#88b0d0",
			"#dfeef8"
		],
		tint: "rgba(180,220,255,0.14)",
		tintBlend: "screen",
		particleColor: "#eaf5ff",
		particleShape: "snow",
		windScale: 1.6,
		gravityScale: 1,
		terrainTop: [
			234,
			242,
			248
		],
		terrainMid: [
			168,
			191,
			208
		],
		terrainDeep: [
			42,
			58,
			74
		]
	},
	{
		id: "desert",
		label: "Deserto",
		description: "Operação Areia Vermelha — dunas ao crepúsculo",
		bgImage: {
			version: 1,
			asset_id: "c77a1f58-825e-4d18-97b5-5e4172022451",
			project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
			url: "/__l5e/assets-v1/c77a1f58-825e-4d18-97b5-5e4172022451/bg-desert.jpg",
			r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/c77a1f58-825e-4d18-97b5-5e4172022451/bg-desert.jpg",
			original_filename: "bg-desert.jpg",
			size: 365177,
			content_type: "image/jpeg",
			created_at: "2026-07-20T02:23:19Z"
		}.url,
		bgFocus: {
			x: .5,
			y: .55
		},
		sky: [
			"#3a1a08",
			"#8a3a12",
			"#e08a2a",
			"#f0d068"
		],
		tint: "rgba(230,180,80,0.12)",
		tintBlend: "multiply",
		particleColor: "#f0c880",
		particleShape: "dust",
		windScale: 1.4,
		gravityScale: 1,
		terrainTop: [
			240,
			192,
			102
		],
		terrainMid: [
			196,
			138,
			58
		],
		terrainDeep: [
			90,
			46,
			20
		],
		aimColor: "#00e5ff"
	},
	{
		id: "jungle",
		label: "Selva",
		description: "Operação Garra Silenciosa — verde denso",
		bgImage: {
			version: 1,
			asset_id: "d6bb0111-96f3-40df-b28a-1646b8c3ac73",
			project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
			url: "/__l5e/assets-v1/d6bb0111-96f3-40df-b28a-1646b8c3ac73/bg-jungle.jpg",
			r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/d6bb0111-96f3-40df-b28a-1646b8c3ac73/bg-jungle.jpg",
			original_filename: "bg-jungle.jpg",
			size: 490150,
			content_type: "image/jpeg",
			created_at: "2026-07-20T02:23:23Z"
		}.url,
		bgFocus: {
			x: .5,
			y: .35
		},
		sky: [
			"#0a1810",
			"#183822",
			"#4a6a2a",
			"#c8e070"
		],
		tint: "rgba(80,160,60,0.10)",
		tintBlend: "screen",
		particleColor: "#8adf5a",
		particleShape: "leaf",
		windScale: 1.1,
		gravityScale: 1,
		terrainTop: [
			102,
			200,
			74
		],
		terrainMid: [
			58,
			122,
			46
		],
		terrainDeep: [
			34,
			58,
			24
		]
	}
];
var active = SCENARIOS[0];
function setActiveScenario(id) {
	const s = SCENARIOS.find((x) => x.id === id);
	if (s) active = s;
	return active;
}
function getActiveScenario() {
	return active;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-Cj15J_rU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* 👑 PAINEL DO MESTRE MURILO (Alt + Shift + M)
* Injetado automaticamente para testes, trapaças de desenvolvedor e depuração em todos os jogos.
*/
function MuriloMasterAdmin() {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [feedback, setFeedback] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const handleKeyDown = (e) => {
			if (e.altKey && e.shiftKey && (e.key === "M" || e.key === "m")) {
				e.preventDefault();
				setIsOpen((prev) => !prev);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
	if (!isOpen) return null;
	const showMsg = (msg) => {
		setFeedback(msg);
		setTimeout(() => setFeedback(""), 3e3);
	};
	const handleAddCoins = () => {
		try {
			[
				"player_coins",
				"coins",
				"chips",
				"balance",
				"mico_prefs",
				"bj_profile",
				"user_profile"
			].forEach((k) => {
				const val = localStorage.getItem(k);
				if (val) try {
					const parsed = JSON.parse(val);
					if (typeof parsed === "object") {
						if ("balance" in parsed) parsed.balance = (Number(parsed.balance) || 0) + 5e4;
						if ("coins" in parsed) parsed.coins = (Number(parsed.coins) || 0) + 5e4;
						if ("chips" in parsed) parsed.chips = (Number(parsed.chips) || 0) + 5e4;
						localStorage.setItem(k, JSON.stringify(parsed));
					} else if (typeof parsed === "number") localStorage.setItem(k, JSON.stringify(parsed + 5e4));
				} catch {
					localStorage.setItem(k, "50000");
				}
				else localStorage.setItem(k, "50000");
			});
			showMsg("💰 +50.000 Fichas/Moedas injetadas com sucesso!");
		} catch {
			showMsg("Erro ao adicionar moedas.");
		}
	};
	const handleUnlockAll = () => {
		try {
			localStorage.setItem("all_unlocked", "true");
			localStorage.setItem("vip_status", "true");
			showMsg("👑 Todos os temas, itens e modos desbloqueados!");
		} catch {
			showMsg("Erro ao desbloquear.");
		}
	};
	const handleInstantWin = () => {
		showMsg("🏆 Sinal de Vitória enviado ao jogo!");
		window.dispatchEvent(new CustomEvent("ADMIN_INSTANT_WIN", { detail: { winner: "player" } }));
	};
	const handleRevealCards = () => {
		showMsg("🃏 Modo Raio-X ativado (Cartas reveladas)!");
		window.dispatchEvent(new CustomEvent("ADMIN_REVEAL_CARDS", { detail: { xray: true } }));
		document.querySelectorAll("[data-card-hidden], .card-back, .carta-oculta").forEach((el) => {
			el.style.opacity = "0.35";
			el.style.filter = "brightness(1.5)";
		});
	};
	const handleResetData = () => {
		if (window.confirm("Deseja resetar o progresso local deste jogo para testes?")) {
			localStorage.clear();
			sessionStorage.clear();
			showMsg("🔄 Dados resetados!");
			setTimeout(() => window.location.reload(), 800);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			position: "fixed",
			bottom: "20px",
			right: "20px",
			zIndex: 999999,
			background: "#0d1117",
			border: "3px solid #facc15",
			borderRadius: "16px",
			padding: "16px",
			color: "#ffffff",
			fontFamily: "system-ui, -apple-system, sans-serif",
			boxShadow: "0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(250,204,21,0.4)",
			minWidth: "280px",
			maxWidth: "340px"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: "12px",
					borderBottom: "1px solid #30363d",
					paddingBottom: "8px"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: "8px"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: { fontSize: "20px" },
						children: "👑"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontWeight: "900",
							fontSize: "13px",
							color: "#facc15",
							letterSpacing: "0.05em"
						},
						children: "PAINEL DO MESTRE MURILO"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: "10px",
							color: "#8b949e"
						},
						children: "Modo Administrador (Alt + Shift + M)"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setIsOpen(false),
					style: {
						background: "transparent",
						border: "none",
						color: "#8b949e",
						cursor: "pointer",
						fontSize: "16px",
						fontWeight: "bold"
					},
					children: "✕"
				})]
			}),
			feedback && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					background: "#1e3a8a",
					color: "#93c5fd",
					padding: "6px 10px",
					borderRadius: "8px",
					fontSize: "11px",
					fontWeight: "bold",
					marginBottom: "10px",
					textAlign: "center"
				},
				children: feedback
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: "8px"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleAddCoins,
						style: {
							background: "#eab308",
							color: "#000",
							border: "2px solid #000",
							borderRadius: "8px",
							padding: "8px 12px",
							fontWeight: "bold",
							fontSize: "12px",
							cursor: "pointer",
							textAlign: "left"
						},
						children: "💰 +50.000 Moedas / Fichas Infinitas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleRevealCards,
						style: {
							background: "#3b82f6",
							color: "#fff",
							border: "2px solid #000",
							borderRadius: "8px",
							padding: "8px 12px",
							fontWeight: "bold",
							fontSize: "12px",
							cursor: "pointer",
							textAlign: "left"
						},
						children: "🃏 Modo Raio-X (Revelar Cartas)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleUnlockAll,
						style: {
							background: "#8b5cf6",
							color: "#fff",
							border: "2px solid #000",
							borderRadius: "8px",
							padding: "8px 12px",
							fontWeight: "bold",
							fontSize: "12px",
							cursor: "pointer",
							textAlign: "left"
						},
						children: "⚡ Desbloquear Tudo (Temas & Itens)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleInstantWin,
						style: {
							background: "#10b981",
							color: "#000",
							border: "2px solid #000",
							borderRadius: "8px",
							padding: "8px 12px",
							fontWeight: "bold",
							fontSize: "12px",
							cursor: "pointer",
							textAlign: "left"
						},
						children: "🏆 Forçar Vitória (Testar Win Screen)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleResetData,
						style: {
							background: "#ef4444",
							color: "#fff",
							border: "2px solid #000",
							borderRadius: "8px",
							padding: "8px 12px",
							fontWeight: "bold",
							fontSize: "11px",
							cursor: "pointer",
							textAlign: "left"
						},
						children: "🔄 Resetar Dados do Jogo"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					marginTop: "12px",
					textAlign: "center",
					fontSize: "9px",
					color: "#8b949e",
					borderTop: "1px solid #21262d",
					paddingTop: "6px"
				},
				children: [
					"Pressione ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						style: { color: "#facc15" },
						children: "Alt + Shift + M"
					}),
					" para fechar/abrir"
				]
			})
		]
	});
}
var styles_default = "/assets/styles-CRlxj4Ul.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	window.__lovableReportRuntimeError?.({
		message,
		stack: error instanceof Error ? error.stack : void 0,
		filename: window.location.pathname
	});
}
var TRACK_ENDPOINT = "https://projetoij.lovable.app/api/public/track";
var PROJECT_ID = "wardogs";
var lastPath = null;
function trackPageView(path) {
	if (typeof window === "undefined") return;
	const host = window.location.hostname;
	if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") return;
	if (lastPath === path) return;
	lastPath = path;
	fetch(TRACK_ENDPOINT, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			project: PROJECT_ID,
			event_type: "page_view",
			path
		})
	}).catch(() => {
		try {
			fetch(TRACK_ENDPOINT, {
				method: "POST",
				mode: "no-cors",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					project: PROJECT_ID,
					event_type: "page_view",
					path
				})
			}).catch(() => {});
		} catch {}
	});
}
var SC_KEY = "wardogs.scenario";
var DF_KEY = "wardogs.difficulty";
var _diff = "sergeant";
function getAIDifficulty() {
	return _diff;
}
function _setAIDifficulty(d) {
	_diff = d;
}
var Ctx = (0, import_react.createContext)({
	scenario: SCENARIOS[0],
	setScenario: () => {},
	scenarios: SCENARIOS,
	difficulty: "sergeant",
	setDifficulty: () => {}
});
function ScenarioProvider({ children }) {
	const [scenario, setScenarioState] = (0, import_react.useState)(SCENARIOS[0]);
	const [difficulty, setDiffState] = (0, import_react.useState)("sergeant");
	(0, import_react.useEffect)(() => {
		try {
			const s = localStorage.getItem(SC_KEY);
			if (s) {
				const f = SCENARIOS.find((x) => x.id === s);
				if (f) {
					setScenarioState(f);
					setActiveScenario(f.id);
				}
			}
			const d = localStorage.getItem(DF_KEY);
			if (d === "recruit" || d === "sergeant" || d === "general") {
				setDiffState(d);
				_setAIDifficulty(d);
			}
		} catch {}
	}, []);
	const setScenario = (id) => {
		const f = SCENARIOS.find((x) => x.id === id);
		if (!f) return;
		setScenarioState(f);
		setActiveScenario(f.id);
		try {
			localStorage.setItem(SC_KEY, id);
		} catch {}
	};
	const setDifficulty = (d) => {
		setDiffState(d);
		_setAIDifficulty(d);
		try {
			localStorage.setItem(DF_KEY, d);
		} catch {}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ctx.Provider, {
		value: {
			scenario,
			setScenario,
			scenarios: SCENARIOS,
			difficulty,
			setDifficulty
		},
		children
	});
}
var useScenario = () => (0, import_react.useContext)(Ctx);
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
var MISSIONS = [
	{
		id: "m1",
		index: 1,
		name: "Treinamento",
		brief: "Primeiro tiro no campo de provas. Aqueça o cano, soldado.",
		scenario: "battlefield",
		difficulty: "recruit",
		enemy: "brutus",
		suggestedPlayer: "ranger"
	},
	{
		id: "m2",
		index: 2,
		name: "Patrulha no Deserto",
		brief: "Uma sombra suspeita cruzou as dunas. Elimine o alvo antes do pôr-do-sol.",
		scenario: "desert",
		difficulty: "recruit",
		enemy: "ozzy",
		suggestedPlayer: "musa"
	},
	{
		id: "m3",
		index: 3,
		name: "Emboscada na Selva",
		brief: "Vento forte entre as copas. Corrija a mira ou desperdice munição.",
		scenario: "jungle",
		difficulty: "sergeant",
		enemy: "musa",
		suggestedPlayer: "ranger",
		modifiers: { windMultiplier: 1.5 }
	},
	{
		id: "m4",
		index: 4,
		name: "Assalto Ártico",
		brief: "O inimigo se entrincheirou no gelo com armadura reforçada.",
		scenario: "arctic",
		difficulty: "sergeant",
		enemy: "brutus",
		suggestedPlayer: "ozzy",
		modifiers: { enemyHpBonus: 25 }
	},
	{
		id: "m5",
		index: 5,
		name: "Duelo do Comandante",
		brief: "General inimigo em campo aberto. Cada tiro precisa contar.",
		scenario: "battlefield",
		difficulty: "general",
		enemy: "ranger",
		suggestedPlayer: "brutus"
	},
	{
		id: "m6",
		index: 6,
		name: "Última Trincheira",
		brief: "Arsenal limitado. Só bazuca, granada e arco. Boa sorte.",
		scenario: "arctic",
		difficulty: "general",
		enemy: "musa",
		suggestedPlayer: "ranger",
		modifiers: {
			allowedWeapons: [
				"bazooka",
				"grenade",
				"bow"
			],
			enemyHpBonus: 15
		}
	},
	{
		id: "m7",
		index: 7,
		name: "Névoa Cortante",
		brief: "Rajadas erráticas cortam o Ártico. Confie no instinto — não no vento.",
		scenario: "arctic",
		difficulty: "sergeant",
		enemy: "ozzy",
		modifiers: {
			chaosWind: true,
			turnTimeSeconds: 20
		},
		suggestedPlayer: "ranger"
	},
	{
		id: "m8",
		index: 8,
		name: "Sniper de Dunas",
		brief: "Sem mira assistida. Só arco, RPG e bazuca. Leia o vento e respire.",
		scenario: "desert",
		difficulty: "general",
		enemy: "ranger",
		modifiers: {
			disableAimAssist: true,
			allowedWeapons: [
				"bow",
				"rpg",
				"bazooka"
			]
		},
		suggestedPlayer: "musa"
	},
	{
		id: "m9",
		index: 9,
		name: "Trovoada",
		brief: "Vento dobrado, força escondida, sem mira assistida. Só cães de verdade sobrevivem.",
		scenario: "jungle",
		difficulty: "general",
		enemy: "brutus",
		modifiers: {
			windMultiplier: 2,
			disableAimAssist: true,
			hidePower: true
		},
		suggestedPlayer: "ozzy"
	},
	{
		id: "bonus1",
		index: 10,
		name: "Cão Louco",
		brief: "Missão bônus. Vento errante, blindagem inimiga máxima e General à espreita.",
		scenario: "jungle",
		difficulty: "general",
		enemy: "ozzy",
		suggestedPlayer: "musa",
		modifiers: {
			enemyHpBonus: 40,
			windMultiplier: 2
		},
		bonus: true
	},
	{
		id: "bonus2",
		index: 11,
		name: "Cão Insano",
		brief: "Reforço inimigo em campo: HP dobrado, Fúria pronta desde o 1º turno, mira travada, vento caótico. Só pra veteranos.",
		scenario: "battlefield",
		difficulty: "general",
		enemy: "brutus",
		suggestedPlayer: "ranger",
		modifiers: {
			enemyHpBonus: 80,
			enemyRageCharged: true,
			disableAimAssist: true,
			chaosWind: true,
			turnTimeSeconds: 20
		},
		bonus: true
	},
	{
		id: "bonus3",
		index: 12,
		name: "Blackout",
		brief: "Missão bônus: só explosivos de área, sem mira assistida e inimigo reforçado.",
		scenario: "arctic",
		difficulty: "general",
		enemy: "musa",
		suggestedPlayer: "ranger",
		modifiers: {
			allowedWeapons: [
				"grenade",
				"frag",
				"cluster"
			],
			disableAimAssist: true,
			enemyHpBonus: 30
		},
		bonus: true
	}
];
function getMission(id) {
	return MISSIONS.find((m) => m.id === id);
}
function nextMission(id) {
	const idx = MISSIONS.findIndex((m) => m.id === id);
	if (idx < 0 || idx >= MISSIONS.length - 1) return void 0;
	return MISSIONS[idx + 1];
}
var KEY$1 = "wardogs.campaign.v1";
var empty$1 = () => ({ stars: {} });
function loadProgress() {
	if (typeof localStorage === "undefined") return empty$1();
	try {
		const raw = localStorage.getItem(KEY$1);
		if (!raw) return empty$1();
		const p = JSON.parse(raw);
		return {
			stars: p.stars ?? {},
			lastCharacter: p.lastCharacter
		};
	} catch {
		return empty$1();
	}
}
function saveProgress(p) {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(KEY$1, JSON.stringify(p));
	} catch {}
}
function awardStars(missionId, stars) {
	const p = loadProgress();
	if (stars > (p.stars[missionId] ?? 0)) {
		p.stars[missionId] = stars;
		saveProgress(p);
	}
}
function setLastCharacter(c) {
	const p = loadProgress();
	p.lastCharacter = c;
	saveProgress(p);
}
function isUnlocked(mission, progress) {
	if (mission.index === 1) return true;
	if (mission.bonus) return MISSIONS.filter((m) => !m.bonus).every((m) => (progress.stars[m.id] ?? 0) >= 1);
	const prev = MISSIONS.find((m) => m.index === mission.index - 1);
	if (!prev) return true;
	return (progress.stars[prev.id] ?? 0) >= 1;
}
function computeStars(playerHpPct, won) {
	if (!won) return 0;
	if (playerHpPct >= .7) return 3;
	if (playerHpPct >= .3) return 2;
	return 1;
}
var KEY = "wardogs.unlocks.v1";
function empty() {
	return { characters: [] };
}
function loadUnlocks() {
	if (typeof localStorage === "undefined") return empty();
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return empty();
		const p = JSON.parse(raw);
		return {
			characters: p.characters ?? [],
			adminOverride: p.adminOverride
		};
	} catch {
		return empty();
	}
}
function saveUnlocks(s) {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(KEY, JSON.stringify(s));
	} catch {}
}
function setAdminOverride(v) {
	const s = loadUnlocks();
	s.adminOverride = v;
	saveUnlocks(s);
	if (typeof window !== "undefined") try {
		window.dispatchEvent(new Event("wardogs:admin-override-changed"));
	} catch {}
}
function isAdminOverride() {
	return !!loadUnlocks().adminOverride;
}
/**
* Regras de desbloqueio:
* - ranger, brutus, musa, ozzy → sempre disponíveis
* - negao (Corso, Elite) → concluir 6 missões da campanha (≥1 estrela cada)
* - miu (Elite) → concluir 9 missões da campanha (≥1 estrela cada)
* - barto (Elite) → concluir 12 missões da campanha (≥1 estrela cada)
* - Admin override desbloqueia todos.
*/
function isCharacterUnlocked(id) {
	const s = loadUnlocks();
	if (s.adminOverride) return true;
	if (s.characters.includes(id)) return true;
	if (id === "negao" || id === "miu" || id === "barto") {
		const prog = loadProgress();
		return MISSIONS.filter((m) => !m.bonus && (prog.stars[m.id] ?? 0) >= 1).length >= (id === "negao" ? 6 : id === "miu" ? 9 : 12);
	}
	return true;
}
function characterUnlockHint(id) {
	if (id === "negao") return "Conclua 6 missões da Campanha para desbloquear Corso.";
	if (id === "miu") return "Conclua 9 missões da Campanha para desbloquear Miu.";
	if (id === "barto") return "Conclua 12 missões da Campanha para desbloquear Bartô.";
	return "";
}
/**
* Atalho de teclado do desenvolvedor:
* Ctrl+Shift+U (ou Cmd+Shift+U no Mac) → alterna o override que libera
* todos os personagens elite (Corso, Miu) sem precisar concluir a campanha.
*
* Segurança: só afeta o localStorage do próprio navegador — não é auth,
* é conveniência de teste local. Ninguém consegue tocar em outros jogadores.
*/
function useDevShortcuts() {
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
			if (e.key.toLowerCase() !== "u") return;
			e.preventDefault();
			const current = !!loadUnlocks().adminOverride;
			setAdminOverride(!current);
			if (!current) toast.success("🔓 Modo dev: elites liberados", { description: "Corso e Miu disponíveis no briefing." });
			else toast("🔒 Modo dev: elites bloqueados", { description: "Progressão normal restaurada." });
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground stencil",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Alvo não localizado"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Esta posição não existe no mapa."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "btn-hud btn-primary",
						children: "Voltar à base"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground stencil",
					children: "Falha no combate"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Algo deu errado. Tente recarregar a missão."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "btn-hud btn-primary",
						children: "Reiniciar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "btn-hud",
						children: "Base"
					})]
				})
			]
		})
	});
}
var Route$7 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content"
			},
			{
				name: "theme-color",
				content: "#2a331f"
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent"
			},
			{
				name: "apple-mobile-web-app-title",
				content: "WarDogs"
			},
			{ title: "WarDogs — Artilharia Canina" },
			{
				name: "description",
				content: "Jogo de artilharia por turnos estilo Worms. Ranger e Brutus duelam com bazuca, RPG, arco, cluster e air strike em cenários destrutíveis."
			},
			{
				property: "og:title",
				content: "WarDogs — Artilharia Canina"
			},
			{
				property: "og:description",
				content: "Jogo de artilharia por turnos estilo Worms. Ranger e Brutus duelam com bazuca, RPG, arco, cluster e air strike em cenários destrutíveis."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:title",
				content: "WarDogs — Artilharia Canina"
			},
			{
				name: "twitter:description",
				content: "Jogo de artilharia por turnos estilo Worms. Ranger e Brutus duelam com bazuca, RPG, arco, cluster e air strike em cenários destrutíveis."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/660f280a-2cb2-442d-819e-12ce19de5213/id-preview-37c46523--17ec0423-0d86-4815-bfd7-dd26c1f5ed41.lovable.app-1784562612054.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/660f280a-2cb2-442d-819e-12ce19de5213/id-preview-37c46523--17ec0423-0d86-4815-bfd7-dd26c1f5ed41.lovable.app-1784562612054.png"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32.png"
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "192x192",
				href: "/icon-192.png"
			},
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Chakra+Petch:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=Bangers&family=Comic+Neue:wght@700&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "pt-BR",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$7.useRouteContext();
	useDevShortcuts();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	(0, import_react.useEffect)(() => {
		trackPageView(pathname);
	}, [pathname]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ScenarioProvider, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MuriloMasterAdmin, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})
		] })
	});
}
var $$splitComponentImporter$5 = () => import("./routes-ChdvXKBP.mjs");
var Route$6 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "WarDogs — Batalhas táticas entre pelotões caninos" },
		{
			name: "description",
			content: "Entre no campo de guerra de WarDogs e comande esquadrões táticos em batalhas por turnos com cenários destrutíveis, campanha, partidas online e duelos locais."
		},
		{
			property: "og:title",
			content: "WarDogs — Batalhas táticas entre pelotões caninos"
		},
		{
			property: "og:description",
			content: "Entre no campo de guerra de WarDogs e comande esquadrões táticos em batalhas por turnos com cenários destrutíveis, campanha, partidas online e duelos locais."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{
			name: "twitter:title",
			content: "WarDogs — Batalhas táticas entre pelotões caninos"
		},
		{
			name: "twitter:description",
			content: "Entre no campo de guerra de WarDogs e comande esquadrões táticos em batalhas por turnos com cenários destrutíveis, campanha, partidas online e duelos locais."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./online-D_QrGqDO.mjs");
var Route$5 = createFileRoute("/online")({
	component: lazyRouteComponent($$splitComponentImporter$4, "component"),
	head: () => ({ meta: [
		{ title: "WarDogs — Multiplayer online" },
		{
			name: "description",
			content: "Crie uma sala ou entre com código para jogar WarDogs online com até 4 companheiros de pelotão."
		},
		{
			property: "og:title",
			content: "WarDogs — Multiplayer online"
		},
		{
			property: "og:description",
			content: "Crie uma sala ou entre com código para jogar WarDogs online com até 4 companheiros de pelotão."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] })
});
var BASE_URL = "";
var Route$4 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async () => {
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[{
		path: "/",
		changefreq: "monthly",
		priority: "1.0"
	}].map((e) => `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`).join("\n")}\n</urlset>`;
	return new Response(xml, { headers: {
		"Content-Type": "application/xml",
		"Cache-Control": "public, max-age=3600"
	} });
} } } });
var $$splitComponentImporter$3 = () => import("./campaign.index-iEcbbjuL.mjs");
var Route$3 = createFileRoute("/campaign/")({
	head: () => ({ meta: [
		{ title: "Campanha — WarDogs" },
		{
			name: "description",
			content: "Missões táticas com dificuldade progressiva e recompensas em estrelas."
		},
		{
			property: "og:title",
			content: "Campanha — WarDogs"
		},
		{
			property: "og:description",
			content: "Missões táticas com dificuldade progressiva e recompensas em estrelas."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitNotFoundComponentImporter = () => import("./campaign._missionId-CH12t0CZ.mjs");
var $$splitComponentImporter$2 = () => import("./campaign._missionId-6O462FEg.mjs");
var Route$2 = createFileRoute("/campaign/$missionId")({
	head: ({ params }) => ({ meta: [
		{ title: `Missão ${params.missionId} — WarDogs` },
		{
			name: "description",
			content: `Briefing da missão ${params.missionId} da campanha WarDogs.`
		},
		{
			property: "og:title",
			content: `Missão ${params.missionId} — WarDogs`
		},
		{
			property: "og:description",
			content: `Briefing da missão ${params.missionId} da campanha WarDogs.`
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
var $$splitComponentImporter$1 = () => import("./lobby._code-CO-oxLJw.mjs");
var Route$1 = createFileRoute("/lobby/$code")({
	component: lazyRouteComponent($$splitComponentImporter$1, "component"),
	head: () => ({ meta: [
		{ title: "WarDogs — Sala de espera" },
		{
			name: "description",
			content: "Sala de espera do multiplayer WarDogs. Escolha seu personagem, marque pronto e aguarde o anfitrião iniciar."
		},
		{
			property: "og:title",
			content: "WarDogs — Sala de espera"
		},
		{
			property: "og:description",
			content: "Sala de espera do multiplayer WarDogs. Escolha seu personagem, marque pronto e aguarde o anfitrião iniciar."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] })
});
var $$splitErrorComponentImporter = () => import("./match._code-CS-N0k3e.mjs");
var $$splitComponentImporter = () => import("./match._code-C25CZwPY.mjs");
var Route = createFileRoute("/match/$code")({
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	head: () => ({ meta: [
		{ title: "WarDogs — Combate online" },
		{
			name: "description",
			content: "Combate multiplayer online em curso — WarDogs."
		},
		{
			property: "og:title",
			content: "WarDogs — Combate online"
		},
		{
			property: "og:description",
			content: "Combate multiplayer online em curso — WarDogs."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] })
});
var IndexRoute = Route$6.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$7
});
var OnlineRoute = Route$5.update({
	id: "/online",
	path: "/online",
	getParentRoute: () => Route$7
});
var SitemapDotxmlRoute = Route$4.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$7
});
var CampaignIndexRoute = Route$3.update({
	id: "/campaign/",
	path: "/campaign/",
	getParentRoute: () => Route$7
});
var rootRouteChildren = {
	IndexRoute,
	OnlineRoute,
	SitemapDotxmlRoute,
	CampaignMissionIdRoute: Route$2.update({
		id: "/campaign/$missionId",
		path: "/campaign/$missionId",
		getParentRoute: () => Route$7
	}),
	LobbyCodeRoute: Route$1.update({
		id: "/lobby/$code",
		path: "/lobby/$code",
		getParentRoute: () => Route$7
	}),
	MatchCodeRoute: Route.update({
		id: "/match/$code",
		path: "/match/$code",
		getParentRoute: () => Route$7
	}),
	CampaignIndexRoute
};
var routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getAIDifficulty as _, characterUnlockHint as a, getActiveScenario as b, MISSIONS as c, getMission as d, isUnlocked as f, _setAIDifficulty as g, setLastCharacter as h, Route$2 as i, awardStars as l, nextMission as m, Route as n, isAdminOverride as o, loadProgress as p, Route$1 as r, isCharacterUnlocked as s, router_exports as t, computeStars as u, useScenario as v, setActiveScenario as x, SCENARIOS as y };
