import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as useNavigate, x as useRouter, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Route$1, y as SCENARIOS } from "./router-Cj15J_rU.mjs";
import { t as CHARACTERS } from "./characters-DgQbMrji.mjs";
import { _ as ArrowLeft, c as Play, f as LoaderCircle, g as Check, m as Copy, u as LogOut } from "../_libs/lucide-react.mjs";
import { t as supabase } from "./client-Doxa_S3-.mjs";
import { a as fetchMatchByCode, f as updateMatch, i as ensureAnonSession, o as fetchPlayers, p as updateSelfPlayer, u as leaveMatch } from "./matchApi-B42GtUpp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lobby._code-CO-oxLJw.js
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
function Lobby() {
	const { code } = Route$1.useParams();
	const navigate = useNavigate();
	const router = useRouter();
	const [userId, setUserId] = (0, import_react.useState)(null);
	const [match, setMatch] = (0, import_react.useState)(null);
	const [players, setPlayers] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	const [starting, setStarting] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const navigatedRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			const s = await ensureAnonSession();
			if (!s) {
				setError("Sem sessão");
				return;
			}
			if (cancelled) return;
			setUserId(s.userId);
			const m = await fetchMatchByCode(code);
			if (cancelled) return;
			if (!m) {
				setError("Sala não encontrada");
				return;
			}
			setMatch(m);
			const ps = await fetchPlayers(m.id);
			if (cancelled) return;
			setPlayers(ps);
			if (!ps.some((p) => p.user_id === s.userId)) setError("Você não está nesta sala. Volte e entre pelo código.");
		})().catch((e) => setError(e instanceof Error ? e.message : "Erro"));
		return () => {
			cancelled = true;
		};
	}, [code]);
	(0, import_react.useEffect)(() => {
		if (!match) return;
		const ch = supabase.channel(`lobby:${match.id}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "match_players",
			filter: `match_id=eq.${match.id}`
		}, async () => {
			const ps = await fetchPlayers(match.id);
			setPlayers(ps);
		}).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "matches",
			filter: `id=eq.${match.id}`
		}, (payload) => {
			const next = payload.new;
			setMatch(next);
			if (next.status === "playing" && !navigatedRef.current) {
				navigatedRef.current = true;
				navigate({
					to: "/match/$code",
					params: { code: next.code }
				});
			}
		}).subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	}, [match, navigate]);
	(0, import_react.useEffect)(() => {
		if (!match) return;
		updateSelfPlayer(match.id, { connected: true }).catch(() => {});
		const onUnload = () => {
			updateSelfPlayer(match.id, { connected: false }).catch(() => {});
		};
		window.addEventListener("beforeunload", onUnload);
		return () => {
			window.removeEventListener("beforeunload", onUnload);
		};
	}, [match]);
	const me = (0, import_react.useMemo)(() => players.find((p) => p.user_id === userId) ?? null, [players, userId]);
	const isHost = !!(match && userId && match.host_id === userId);
	const readyCount = players.filter((p) => p.ready).length;
	const canStart = isHost && players.length >= 2 && readyCount === players.length;
	const onToggleReady = async () => {
		if (!match || !me) return;
		await updateSelfPlayer(match.id, { ready: !me.ready });
	};
	const onPickChar = async (charId) => {
		if (!match || !me) return;
		await updateSelfPlayer(match.id, { char_id: charId });
	};
	const onLeave = async () => {
		if (!match) return;
		await leaveMatch(match.id);
		navigate({ to: "/online" });
	};
	const onStart = async () => {
		if (!match || !isHost) return;
		setStarting(true);
		try {
			await updateMatch(match.id, {
				status: "playing",
				started_at: (/* @__PURE__ */ new Date()).toISOString(),
				turn_slot: 0
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erro ao iniciar");
			setStarting(false);
		}
	};
	const copyCode = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {}
	};
	const scenario = match ? SCENARIOS.find((s) => s.id === match.scenario) : null;
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-dvh flex items-center justify-center bg-background p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel p-4 max-w-md text-center space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stencil text-warn text-sm uppercase",
					children: "Sala indisponível"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/online",
					className: "btn-hud inline-flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 14 }), " Voltar"]
				})
			]
		})
	});
	if (!match || !me) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-dvh flex items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin text-muted-foreground" })
	});
	const slots = Array.from({ length: match.max_players }, (_, i) => players.find((p) => p.slot === i) ?? null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground flex flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "p-3 sm:p-4 flex items-center gap-3 flex-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onLeave,
						className: "btn-hud text-xs inline-flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 14 }), " Sair"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "stencil uppercase tracking-[0.3em] text-sm",
						children: "Sala de espera"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "panel px-3 py-1.5 font-mono text-xl tracking-[0.4em] uppercase",
							children: code
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: copyCode,
							className: "btn-hud text-xs inline-flex items-center gap-1",
							children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 14 }), " Copiado"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 14 }), " Código"] })
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 px-4 pb-6 max-w-3xl mx-auto w-full space-y-4",
				children: [
					scenario && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel p-3 text-xs flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground uppercase tracking-widest text-[10px]",
							children: "Cenário: "
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "stencil",
							children: scenario.label
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-muted-foreground",
							children: scenario.description
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
						children: slots.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `panel p-3 ${p ? "" : "opacity-60 border-dashed"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Slot ", i + 1] }), p && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `px-1.5 py-0.5 rounded text-[9px] ${p.ready ? "bg-[color:var(--team-green)] text-black" : "bg-secondary"}`,
									children: p.ready ? "PRONTO" : "AJUSTANDO"
								})]
							}), p ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-14 h-14 rounded bg-secondary/60 border border-border/60 overflow-hidden flex items-center justify-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: CHARACTERS[p.char_id ?? "ranger"]?.portraitUrl,
										alt: CHARACTERS[p.char_id ?? "ranger"]?.name ?? p.char_id,
										className: "w-full h-full object-contain",
										draggable: false
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm font-semibold truncate",
										children: [
											p.nickname,
											p.user_id === userId ? " (você)" : "",
											p.user_id === match.host_id ? " ⚑" : ""
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-muted-foreground uppercase tracking-widest",
										children: CHARACTERS[p.char_id ?? "ranger"]?.name ?? p.char_id
									})]
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 text-xs text-muted-foreground italic",
								children: "Vaga aberta"
							})]
						}, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel p-3 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "stencil text-xs uppercase tracking-widest text-muted-foreground",
								children: "Seu personagem"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-4 sm:grid-cols-7 gap-1.5",
								children: CHAR_IDS.map((id) => {
									const c = CHARACTERS[id];
									const active = me.char_id === id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => onPickChar(id),
										className: `btn-hud p-1.5 flex flex-col items-center gap-1 ${active ? "is-selected" : ""}`,
										title: c.name,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-full aspect-square rounded bg-secondary/60 border border-border/50 overflow-hidden flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: c.portraitUrl,
												alt: c.name,
												className: "w-full h-full object-contain",
												draggable: false
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] stencil uppercase tracking-wider truncate w-full text-center",
											children: c.name
										})]
									}, id);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: onToggleReady,
									className: `btn-hud text-xs px-3 py-1.5 ${me.ready ? "btn-primary" : ""}`,
									children: me.ready ? "Cancelar pronto" : "Marcar pronto"
								}), isHost && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: onStart,
									disabled: !canStart || starting,
									className: "btn-hud btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1",
									children: [starting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										size: 12,
										className: "animate-spin"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 12 }), "Iniciar partida"]
								})]
							}),
							!canStart && isHost && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] text-muted-foreground",
								children: players.length < 2 ? "Aguardando pelo menos 2 jogadores." : "Aguardando todos ficarem prontos."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-[10px] text-muted-foreground text-center",
						children: [
							"Compartilhe o código ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono tracking-widest",
								children: code
							}),
							" para outros entrarem."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => router.invalidate(),
				className: "sr-only",
				"aria-hidden": true
			})
		]
	});
}
//#endregion
export { Lobby as component };
