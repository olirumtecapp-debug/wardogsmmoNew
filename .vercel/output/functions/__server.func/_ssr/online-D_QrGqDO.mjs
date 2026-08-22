import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { y as SCENARIOS } from "./router-Cj15J_rU.mjs";
import { t as CHARACTERS } from "./characters-DgQbMrji.mjs";
import { _ as ArrowLeft, a as TriangleAlert, f as LoaderCircle, h as CircleCheck, i as Users, l as Monitor, p as KeyRound, s as Smartphone } from "../_libs/lucide-react.mjs";
import { d as randomNickname, i as ensureAnonSession, l as joinMatchByCode, n as createMatch, r as deviceLabel, s as getDeviceKind, t as DeviceMismatchError } from "./matchApi-B42GtUpp.mjs";
import { t as CharacterInfoPopover } from "./CharacterInfoPopover-MElakdaK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/online-D_QrGqDO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CHAR_IDS = [
	"ranger",
	"brutus",
	"musa",
	"ozzy",
	"negao",
	"miu"
];
function OnlineHome() {
	const navigate = useNavigate();
	const [nickname, setNickname] = (0, import_react.useState)(randomNickname());
	const [charId, setCharId] = (0, import_react.useState)("ranger");
	const [scenario, setScenario] = (0, import_react.useState)(SCENARIOS[0].id);
	const [difficulty] = (0, import_react.useState)("sergeant");
	const [maxPlayers, setMaxPlayers] = (0, import_react.useState)(2);
	const [matchDuration, setMatchDuration] = (0, import_react.useState)(300);
	const [code, setCode] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [mismatch, setMismatch] = (0, import_react.useState)(null);
	const [sessionReady, setSessionReady] = (0, import_react.useState)(false);
	const localDevice = (0, import_react.useMemo)(() => getDeviceKind(), []);
	(0, import_react.useEffect)(() => {
		ensureAnonSession().then((s) => {
			if (s) setSessionReady(true);
			else setError("Não foi possível criar sessão. Recarregue a página.");
		}).catch((e) => setError(e instanceof Error ? e.message : "Falha de sessão"));
	}, []);
	const onCreate = async () => {
		setError(null);
		setBusy("create");
		try {
			const m = await createMatch({
				nickname,
				charId,
				scenario,
				difficulty,
				maxPlayers,
				matchDuration
			});
			navigate({
				to: "/lobby/$code",
				params: { code: m.code }
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao criar sala");
			setBusy(null);
		}
	};
	const onJoin = async () => {
		setError(null);
		setMismatch(null);
		setBusy("join");
		try {
			const clean = code.trim().toUpperCase();
			if (clean.length < 4) throw new Error("Digite o código da sala");
			const { matchId: _mid } = await joinMatchByCode(clean, nickname, charId);
			navigate({
				to: "/lobby/$code",
				params: { code: clean }
			});
		} catch (e) {
			if (e instanceof DeviceMismatchError) setMismatch({
				host: e.hostDevice,
				local: e.localDevice
			});
			else setError(e instanceof Error ? e.message : "Erro ao entrar");
			setBusy(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground flex flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "p-3 sm:p-4 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "btn-hud text-xs inline-flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 14 }), " Base"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stencil uppercase tracking-[0.3em] text-sm",
					children: "Multiplayer online"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 px-4 pb-6 flex flex-col items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-2xl space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel p-4 space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "stencil text-xs uppercase tracking-widest text-muted-foreground",
									children: "Seu operador"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block mb-1 text-muted-foreground uppercase tracking-widest text-[10px]",
										children: "Codinome"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: nickname,
										onChange: (e) => setNickname(e.target.value.slice(0, 20)),
										className: "w-full bg-secondary/70 border border-border/60 rounded px-2 py-1.5 text-sm"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block mb-1.5 text-muted-foreground uppercase tracking-widest text-[10px]",
									children: "Personagem"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-4 sm:grid-cols-7 gap-1",
									children: CHAR_IDS.map((id) => {
										const c = CHARACTERS[id];
										const selected = charId === id;
										const isElite = c.tier === "elite";
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CharacterInfoPopover, {
											charId: id,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => setCharId(id),
												className: `relative w-full rounded-lg border p-1.5 flex flex-col items-center gap-1 transition-all duration-200 ${selected ? "border-primary ring-2 ring-primary/60 bg-primary/10 scale-[1.03] shadow-lg" : "border-border/60 bg-secondary/40 opacity-80 hover:opacity-100 hover:border-border"}`,
												children: [
													selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
														size: 14,
														className: "absolute top-0.5 right-0.5 text-primary drop-shadow"
													}),
													isElite && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "absolute top-0.5 left-0.5 text-[7px] font-bold px-1 rounded bg-primary/90 text-primary-foreground tracking-widest",
														children: "E"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-full aspect-square rounded-md overflow-hidden bg-black/30 flex items-center justify-center",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: c.portraitUrl,
															alt: c.name,
															className: `w-full h-full object-contain ${selected ? "" : "grayscale-[30%]"}`
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: `stencil text-[10px] uppercase tracking-wider truncate max-w-full ${selected ? "text-primary" : "text-foreground"}`,
														children: c.name
													})
												]
											})
										}, id);
									})
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "grid grid-cols-1 md:grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-4 space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "stencil text-xs uppercase tracking-widest",
											children: "Criar sala"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: "Você é o anfitrião. Compartilhe o código com seus aliados."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground border border-border/50 rounded px-2 py-1 bg-secondary/40",
										children: [localDevice === "mobile" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { size: 12 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											"Sala marcada como ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-foreground font-semibold",
												children: deviceLabel(localDevice)
											}),
											" — convide alguém do mesmo tipo de aparelho."
										] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] uppercase tracking-widest text-muted-foreground mb-1",
										children: "Cenário"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-1",
										children: SCENARIOS.map((sc) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setScenario(sc.id),
											className: `btn-hud text-[11px] px-2 py-1 ${scenario === sc.id ? "is-selected" : ""}`,
											children: sc.label
										}, sc.id))
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] uppercase tracking-widest text-muted-foreground mb-1",
											children: "Vagas"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid grid-cols-3 gap-1",
											children: [
												2,
												3,
												4
											].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => setMaxPlayers(n),
												className: `btn-hud text-xs px-2 py-1.5 inline-flex items-center justify-center gap-1 ${maxPlayers === n ? "is-selected" : ""}`,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 12 }),
													n,
													"P"
												]
											}, n))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground mt-1",
											children: "Combate ao vivo hoje: 2 jogadores. 3–4 vagas ficam na sala como aguardando (próxima atualização)."
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] uppercase tracking-widest text-muted-foreground mb-1",
											children: "Duração da partida"
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
												onClick: () => setMatchDuration(o.v),
												className: `btn-hud text-[11px] px-2 py-1.5 ${matchDuration === o.v ? "is-selected" : ""}`,
												children: o.l
											}, o.v))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground mt-1",
											children: "No fim do tempo vence quem tiver mais HP."
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: onCreate,
										disabled: busy !== null || !nickname || !sessionReady,
										className: "btn-hud btn-primary w-full inline-flex items-center justify-center gap-2",
										children: [busy === "create" || !sessionReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
											size: 14,
											className: "animate-spin"
										}) : null, sessionReady ? "Abrir sala" : "Conectando..."]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-4 space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "stencil text-xs uppercase tracking-widest",
											children: "Entrar com código"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: "Peça o código de 5 letras ao seu anfitrião."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: code,
										onChange: (e) => setCode(e.target.value.toUpperCase().slice(0, 6)),
										placeholder: "EX: 7KDXA",
										maxLength: 6,
										className: "w-full text-center tracking-[0.3em] font-mono bg-secondary/70 border border-border/60 rounded px-2 py-3 text-xl uppercase"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: onJoin,
										disabled: busy !== null || code.length < 4 || !nickname || !sessionReady,
										className: "btn-hud w-full inline-flex items-center justify-center gap-2",
										children: [busy === "join" || !sessionReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
											size: 14,
											className: "animate-spin"
										}) : null, sessionReady ? "Entrar na sala" : "Conectando..."]
									})
								]
							})]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel p-3 text-xs text-warn border-warn",
							children: ["Erro: ", error]
						})
					]
				})
			}),
			mismatch && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel max-w-md w-full p-5 space-y-4 border-warn",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-warn",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 20 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "stencil uppercase tracking-widest text-sm",
								children: "Dispositivos incompatíveis"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-center gap-4 py-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center gap-1 text-xs",
									children: [
										mismatch.host === "mobile" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { size: 28 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { size: 28 }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground uppercase tracking-widest text-[10px]",
											children: "Sala"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: deviceLabel(mismatch.host)
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-2xl text-warn",
									children: "≠"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center gap-1 text-xs",
									children: [
										mismatch.local === "mobile" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { size: 28 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { size: 28 }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground uppercase tracking-widest text-[10px]",
											children: "Você"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: deviceLabel(mismatch.local)
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground leading-relaxed",
							children: [
								"Esta sala foi criada em ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-foreground font-semibold",
									children: deviceLabel(mismatch.host)
								}),
								". Para evitar problemas de tela, mira e sincronia entre PC e smartphone, entre por um",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-foreground font-semibold",
									children: [
										" ",
										deviceLabel(mismatch.host),
										" "
									]
								}),
								"também."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMismatch(null),
							className: "btn-hud btn-primary w-full",
							children: "Voltar ao menu"
						})
					]
				})
			})
		]
	});
}
//#endregion
export { OnlineHome as component };
