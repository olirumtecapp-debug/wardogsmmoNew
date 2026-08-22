import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as getMission, g as _setAIDifficulty, h as setLastCharacter, i as Route$2, l as awardStars, m as nextMission, p as loadProgress, u as computeStars, x as setActiveScenario, y as SCENARIOS } from "./router-Cj15J_rU.mjs";
import { n as CHARACTER_LIST, t as CHARACTERS } from "./characters-DgQbMrji.mjs";
import { o as Star } from "../_libs/lucide-react.mjs";
import { c as WarDogsGame, r as ComicIntro, x as shouldSkipIntro } from "./ComicIntro-CTorxFoe.mjs";
import { t as OrientationGate } from "./OrientationGate-r8o6TXBF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaign._missionId-6O462FEg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MissionPage() {
	const { missionId } = Route$2.useParams();
	const navigate = useNavigate();
	const mission = getMission(missionId);
	if (!mission) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh flex items-center justify-center text-muted-foreground",
		children: ["Missão não encontrada.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/campaign",
			className: "btn-hud ml-2 text-xs px-2 py-1",
			children: "Voltar"
		})]
	});
	const progress = loadProgress();
	const [player, setPlayer] = (0, import_react.useState)(progress.lastCharacter ?? mission.suggestedPlayer);
	const [duration, setDuration] = (0, import_react.useState)(300);
	const [stage, setStage] = (0, import_react.useState)("briefing");
	const [result, setResult] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setActiveScenario(mission.scenario);
		_setAIDifficulty(mission.difficulty);
	}, [mission.scenario, mission.difficulty]);
	const scenario = (0, import_react.useMemo)(() => SCENARIOS.find((s) => s.id === mission.scenario), [mission.scenario]);
	if (stage === "playing") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrientationGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WarDogsGame, {
			mode: "ai",
			chars: [player, mission.enemy],
			missionConfig: mission.modifiers,
			matchDuration: duration,
			rageEnabled: true,
			onExit: () => navigate({ to: "/campaign" }),
			onGameOver: ({ winner, playerHpPct }) => {
				const won = winner === 0;
				const stars = computeStars(playerHpPct, won);
				if (won) awardStars(mission.id, stars);
				setResult({
					won,
					stars
				});
				setStage("result");
			}
		})
	}) });
	if (stage === "intro") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComicIntro, {
		chars: [player, mission.enemy],
		scenarioLabel: scenario.label,
		bgImage: scenario.bgImage,
		onDone: () => setStage("playing")
	});
	if (stage === "result" && result) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultScreen, {
		mission,
		result,
		onRetry: () => {
			setResult(null);
			setStage("playing");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrientationGate, {
		soft: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative min-h-dvh overflow-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 -z-20",
					style: {
						backgroundImage: `url(${scenario.bgImage})`,
						backgroundSize: "cover",
						backgroundPosition: "center",
						backgroundColor: "#0b0f16"
					},
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 -z-10 bg-black/70",
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl mx-auto p-3 sm:p-5 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground",
								children: ["Missão ", mission.bonus ? "Bônus" : mission.index]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "stencil text-xl sm:text-2xl tracking-widest",
								children: mission.name
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/campaign",
								className: "btn-hud text-[11px] px-2 py-1",
								children: "← Campanha"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel p-3 sm:p-4 card-in",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm leading-relaxed",
								children: mission.brief
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] uppercase tracking-widest",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										label: "Cenário",
										value: scenario.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										label: "Dificuldade",
										value: mission.difficulty === "recruit" ? "Recruta" : mission.difficulty === "sergeant" ? "Sargento" : "General"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										label: "Inimigo",
										value: CHARACTERS[mission.enemy].name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										label: "Modificador",
										value: modifierLabel(mission)
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel p-3 sm:p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "stencil text-xs uppercase tracking-[0.25em] text-[color:var(--accent)] mb-2",
								children: "Escolher operador"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 sm:grid-cols-4 gap-2",
								children: CHARACTER_LIST.map((c) => {
									const active = c.id === player;
									const color = c.skin.teamColor;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => {
											setPlayer(c.id);
											setLastCharacter(c.id);
										},
										className: `btn-hud p-2 flex flex-col gap-1 items-center text-center ${active ? "is-selected" : ""}`,
										style: active ? {
											borderColor: color,
											boxShadow: `inset 0 0 0 1px ${color}, 0 0 12px ${color}88`
										} : void 0,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: c.portraitUrl,
												alt: c.name,
												className: "w-14 h-14 object-contain",
												style: { filter: active ? `drop-shadow(0 0 6px ${color})` : void 0 }
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "stencil text-[11px] tracking-widest",
												style: { color: active ? color : void 0 },
												children: c.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[9px] text-muted-foreground truncate w-full",
												children: c.breed
											})
										]
									}, c.id);
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel p-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] uppercase tracking-widest text-muted-foreground mb-1",
									children: "Duração da missão"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-4 gap-1",
									children: [
										{
											v: 180,
											l: "3 min"
										},
										{
											v: 300,
											l: "5 min"
										},
										{
											v: 480,
											l: "8 min"
										},
										{
											v: 0,
											l: "∞"
										}
									].map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setDuration(o.v),
										className: `btn-hud text-[11px] px-2 py-1.5 ${duration === o.v ? "is-selected" : ""}`,
										children: o.l
									}, o.v))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-muted-foreground mt-1",
									children: "Encha a barra ⚡ FÚRIA acertando tiros diretos para liberar um turno com +40% dano."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/campaign",
								className: "btn-hud flex-1 py-3 text-center text-[12px]",
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn-hud is-selected flex-[2] py-3 stencil text-base tracking-widest",
								style: {
									borderColor: "var(--accent)",
									boxShadow: "inset 0 0 0 1px var(--accent), 0 0 20px var(--accent)"
								},
								onClick: () => setStage(shouldSkipIntro() ? "playing" : "intro"),
								children: "Iniciar Missão ▸"
							})]
						})
					]
				})
			]
		})
	});
}
function modifierLabel(m) {
	const mods = m.modifiers;
	if (!mods) return "Padrão";
	const parts = [];
	if (mods.enemyHpBonus) parts.push(`+${mods.enemyHpBonus} HP inimigo`);
	if (mods.windMultiplier && mods.windMultiplier !== 1) parts.push(`Vento ${mods.windMultiplier}×`);
	if (mods.chaosWind) parts.push("Vento caótico");
	if (mods.allowedWeapons) parts.push(`Arsenal ${mods.allowedWeapons.length} armas`);
	if (mods.disableAimAssist) parts.push("Sem mira assistida");
	if (mods.hidePower) parts.push("Força oculta");
	if (mods.turnTimeSeconds) parts.push(`Turno ${mods.turnTimeSeconds}s`);
	if (mods.enemyRageCharged) parts.push("Fúria inimiga");
	return parts.join(" · ") || "Padrão";
}
function Chip({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "panel px-2 py-1.5 leading-tight",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[8px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[11px] tracking-wider truncate normal-case",
			children: value
		})]
	});
}
function ResultScreen({ mission, result, onRetry }) {
	const navigate = useNavigate();
	const next = nextMission(mission.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel p-6 sm:p-8 text-center max-w-sm w-full",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stencil text-xs uppercase tracking-[0.3em] text-muted-foreground",
					children: result.won ? "Missão cumprida" : "Missão falhou"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "stencil text-3xl mt-2",
					style: { color: result.won ? "var(--warn)" : "var(--team-red)" },
					children: mission.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 justify-center mt-4",
					children: [
						1,
						2,
						3
					].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
						size: 38,
						className: i <= result.stars ? "fill-[color:var(--warn)] text-[color:var(--warn)] drop-shadow-[0_0_10px_rgba(255,180,80,0.7)]" : "text-muted-foreground/30"
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[11px] text-muted-foreground mt-2 uppercase tracking-widest",
					children: result.won ? result.stars === 3 ? "Sem arranhões" : result.stars === 2 ? "Pouca vida restante" : "Vitória apertada" : "Tente de novo, soldado"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row gap-2 mt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn-hud flex-1 py-2",
							onClick: onRetry,
							children: "Tentar de novo"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn-hud flex-1 py-2",
							onClick: () => navigate({ to: "/campaign" }),
							children: "Mapa"
						}),
						result.won && next && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn-hud flex-1 py-2 is-selected",
							style: {
								borderColor: "var(--accent)",
								boxShadow: "inset 0 0 0 1px var(--accent), 0 0 14px var(--accent)"
							},
							onClick: () => navigate({
								to: "/campaign/$missionId",
								params: { missionId: next.id }
							}),
							children: "Próxima ▸"
						})
					]
				})
			]
		})
	});
}
//#endregion
export { MissionPage as component };
