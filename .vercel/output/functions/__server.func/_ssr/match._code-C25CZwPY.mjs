import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route, x as setActiveScenario, y as SCENARIOS } from "./router-Cj15J_rU.mjs";
import { r as WEAPONS, t as CHARACTERS } from "./characters-DgQbMrji.mjs";
import { _ as ArrowLeft, f as LoaderCircle } from "../_libs/lucide-react.mjs";
import { C as triggerCanineBarrage, S as step, _ as moveDog, a as MatchCountdown, b as setWeapon, f as createGame, g as markTerrainDirty, h as jumpDog, i as HoldButton, l as WindGauge, m as fire, o as MiniPlayer, p as destroyTerrain, r as ComicIntro, s as MobilityBar, t as ArsenalPopup, u as activateShield, v as render, y as setAimAssist } from "./ComicIntro-CTorxFoe.mjs";
import { t as supabase } from "./client-Doxa_S3-.mjs";
import { a as fetchMatchByCode, c as getStoredMatchDuration, f as updateMatch, i as ensureAnonSession, o as fetchPlayers } from "./matchApi-B42GtUpp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/match._code-C25CZwPY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function openMatchChannel(matchId, userId, onEvent, opts = {}) {
	const channel = supabase.channel(`match:${matchId}`, { config: {
		broadcast: {
			self: false,
			ack: false
		},
		presence: { key: userId }
	} });
	let subscribed = false;
	const queue = [];
	channel.on("broadcast", { event: "net" }, (payload) => {
		const ev = payload.payload;
		onEvent(ev, payload.from ?? "");
	});
	channel.on("presence", { event: "join" }, ({ key }) => {
		if (typeof key === "string" && key !== userId) try {
			opts.onPeerJoin?.(key);
		} catch {}
	});
	channel.subscribe(async (status) => {
		if (status === "SUBSCRIBED") {
			subscribed = true;
			try {
				await channel.track({
					user_id: userId,
					at: Date.now()
				});
			} catch {}
			while (queue.length > 0) {
				const ev = queue.shift();
				try {
					await channel.send({
						type: "broadcast",
						event: "net",
						payload: ev
					});
				} catch {}
			}
			try {
				opts.onSubscribed?.();
			} catch {}
		}
	});
	return {
		channel,
		async send(ev) {
			if (!subscribed) {
				queue.push(ev);
				return;
			}
			await channel.send({
				type: "broadcast",
				event: "net",
				payload: ev
			});
		},
		async close() {
			try {
				await channel.untrack();
			} catch {}
			await supabase.removeChannel(channel);
		}
	};
}
function OnlineMatch({ match, players, myUserId, onExit }) {
	const canvasRef = (0, import_react.useRef)(null);
	const frameRef = (0, import_react.useRef)(null);
	const stateRef = (0, import_react.useRef)(null);
	const netRef = (0, import_react.useRef)(null);
	const rafRef = (0, import_react.useRef)(null);
	const lastSnapshotAtRef = (0, import_react.useRef)(0);
	const seenExplosionsRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const angleHoldRef = (0, import_react.useRef)(null);
	const powerHoldRef = (0, import_react.useRef)(null);
	const moveHoldRef = (0, import_react.useRef)(null);
	const dragRef = (0, import_react.useRef)(null);
	const lastAimSendRef = (0, import_react.useRef)(0);
	const lastMoveSendRef = (0, import_react.useRef)(0);
	const localEditUntilRef = (0, import_react.useRef)(0);
	const lastBroadcastTurnRef = (0, import_react.useRef)(-1);
	const pendingSnapshotRef = (0, import_react.useRef)(null);
	const pendingTurnRef = (0, import_react.useRef)(null);
	const lastTurnBeatRef = (0, import_react.useRef)(0);
	const [, setTick] = (0, import_react.useState)(0);
	const [displaySize, setDisplaySize] = (0, import_react.useState)({
		w: 0,
		h: 0
	});
	const [showIntro, setShowIntro] = (0, import_react.useState)(true);
	const [arsenalOpen, setArsenalOpen] = (0, import_react.useState)(false);
	const [hoveredWeapon, setHoveredWeapon] = (0, import_react.useState)(null);
	const [aimAssist, setAimAssistState] = (0, import_react.useState)(() => {
		try {
			return localStorage.getItem("wardogs.aimAssist") !== "0";
		} catch {
			return true;
		}
	});
	(0, import_react.useEffect)(() => {
		setAimAssist(aimAssist);
		try {
			localStorage.setItem("wardogs.aimAssist", aimAssist ? "1" : "0");
		} catch {}
	}, [aimAssist]);
	const fighters = players.filter((p) => p.slot < 2).sort((a, b) => a.slot - b.slot);
	const mySlot = (players.find((p) => p.user_id === myUserId) ?? null)?.slot ?? -1;
	const isHost = match.host_id === myUserId;
	const iAmFighter = mySlot === 0 || mySlot === 1;
	const chars = (0, import_react.useMemo)(() => [fighters[0]?.char_id ?? "ranger", fighters[1]?.char_id ?? "brutus"], [fighters]);
	(0, import_react.useEffect)(() => {
		setActiveScenario(match.scenario);
	}, [match.scenario]);
	(0, import_react.useEffect)(() => {
		if (fighters.length < 2) return;
		const canvas = canvasRef.current;
		const parent = frameRef.current;
		if (!canvas || !parent) return;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const storedDur = getStoredMatchDuration(match.code);
		const WORLD_W = match.world_w || 1280;
		const WORLD_H = match.world_h || 720;
		const HUD_RESERVE = Math.round(WORLD_H * .2);
		const TOP_RESERVE = Math.round(WORLD_H * .15);
		const initIfNeeded = () => {
			if (stateRef.current) return;
			try {
				stateRef.current = createGame(WORLD_W, WORLD_H, "online", match.seed, HUD_RESERVE, chars, storedDur, false, TOP_RESERVE);
			} catch (err) {
				console.error("[OnlineMatch] createGame failed", err);
				throw err instanceof Error ? err : /* @__PURE__ */ new Error("Falha ao iniciar simulação");
			}
			markTerrainDirty();
			if (isHost && stateRef.current) stateRef.current.onExplosion = (x, y, r) => {
				seenExplosionsRef.current.add(fp(x, y, r));
				netRef.current?.send({
					t: "explosion",
					x,
					y,
					r
				});
			};
			const pendSnap = pendingSnapshotRef.current;
			if (pendSnap && !isHost) {
				apply(stateRef.current, pendSnap, false);
				pendingSnapshotRef.current = null;
			}
			const pendTurn = pendingTurnRef.current;
			if (pendTurn && !isHost && stateRef.current) {
				stateRef.current.currentPlayer = pendTurn.slot === 0 ? 0 : 1;
				stateRef.current.wind = pendTurn.wind;
				stateRef.current.phase = "aiming";
				pendingTurnRef.current = null;
			}
			if (isHost && netRef.current && stateRef.current) {
				netRef.current.send({
					t: "snapshot",
					state: serialize(stateRef.current)
				});
				netRef.current.send({
					t: "turn",
					slot: stateRef.current.currentPlayer,
					wind: stateRef.current.wind
				});
				lastBroadcastTurnRef.current = stateRef.current.currentPlayer;
			}
		};
		const adapt = () => {
			initIfNeeded();
			const s = stateRef.current;
			if (!s) return;
			const r = parent.getBoundingClientRect();
			if (r.width < 10 || r.height < 10) return;
			const scale = Math.min(r.width / s.width, r.height / s.height);
			const cssW = Math.max(1, Math.floor(s.width * scale));
			const cssH = Math.max(1, Math.floor(s.height * scale));
			canvas.style.width = `${cssW}px`;
			canvas.style.height = `${cssH}px`;
			canvas.width = Math.floor(cssW * dpr);
			canvas.height = Math.floor(cssH * dpr);
			const ctx = canvas.getContext("2d");
			const sx = cssW * dpr / s.width;
			const sy = cssH * dpr / s.height;
			ctx.setTransform(sx, 0, 0, sy, 0, 0);
			markTerrainDirty();
			setDisplaySize((prev) => prev.w === cssW && prev.h === cssH ? prev : {
				w: cssW,
				h: cssH
			});
		};
		adapt();
		const ro = new ResizeObserver(adapt);
		ro.observe(parent);
		return () => {
			ro.disconnect();
		};
	}, [
		match.seed,
		match.id,
		match.world_w,
		match.world_h,
		fighters.length
	]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const toWorld = (e) => {
			const rect = canvas.getBoundingClientRect();
			const s = stateRef.current;
			const sx = s ? s.width / Math.max(1, rect.width) : 1;
			const sy = s ? s.height / Math.max(1, rect.height) : 1;
			return {
				x: (e.clientX - rect.left) * sx,
				y: (e.clientY - rect.top) * sy
			};
		};
		const isMyTurn = () => {
			const s = stateRef.current;
			return !!(s && iAmFighter && s.currentPlayer === mySlot && s.phase === "aiming" && s.winner === null);
		};
		const onDown = (e) => {
			if (!isMyTurn()) return;
			const { x, y } = toWorld(e);
			dragRef.current = {
				startX: x,
				startY: y
			};
		};
		const onMove = (e) => {
			const s = stateRef.current;
			const drag = dragRef.current;
			if (!s || !drag || !isMyTurn()) return;
			const { x: px, y: py } = toWorld(e);
			const dog = s.dogs[s.currentPlayer];
			const dx = (px - drag.startX) * -dog.facing;
			const dy = drag.startY - py;
			const mag = Math.hypot(px - drag.startX, py - drag.startY);
			if (mag > 6) {
				const ang = Math.atan2(dy, dx) * 180 / Math.PI;
				if (ang >= 0 && ang <= 90) s.angle = clamp(ang, 5, 88);
				const pw = Math.min(100, mag * 1.2);
				if (pw > 15) s.power = pw;
				localEditUntilRef.current = performance.now() + 250;
				const now = performance.now();
				if (now - lastAimSendRef.current > 60) {
					lastAimSendRef.current = now;
					sendInput({
						k: "angle",
						v: s.angle
					}, true);
					sendInput({
						k: "power",
						v: s.power
					}, true);
				}
			}
		};
		const onUp = (e) => {
			const drag = dragRef.current;
			dragRef.current = null;
			if (!drag || !isMyTurn()) return;
			const { x: px, y: py } = toWorld(e);
			if (Math.hypot(px - drag.startX, py - drag.startY) <= 20) sendInput({ k: "fire" });
			else sendInput({ k: "fire" });
		};
		canvas.addEventListener("pointerdown", onDown);
		canvas.addEventListener("pointermove", onMove);
		canvas.addEventListener("pointerup", onUp);
		canvas.addEventListener("pointercancel", onUp);
		return () => {
			canvas.removeEventListener("pointerdown", onDown);
			canvas.removeEventListener("pointermove", onMove);
			canvas.removeEventListener("pointerup", onUp);
			canvas.removeEventListener("pointercancel", onUp);
		};
	}, [iAmFighter, mySlot]);
	(0, import_react.useEffect)(() => {
		const emitInitialHostState = () => {
			if (!isHost) return;
			const s = stateRef.current;
			if (!s) return;
			netRef.current?.send({
				t: "snapshot",
				state: serialize(s)
			});
			netRef.current?.send({
				t: "turn",
				slot: s.currentPlayer,
				wind: s.wind
			});
			lastBroadcastTurnRef.current = s.currentPlayer;
		};
		const ch = openMatchChannel(match.id, myUserId, (ev) => onNetEvent(ev), {
			onSubscribed: emitInitialHostState,
			onPeerJoin: () => emitInitialHostState()
		});
		netRef.current = ch;
		return () => {
			ch.close();
			netRef.current = null;
		};
	}, [
		match.id,
		myUserId,
		isHost
	]);
	(0, import_react.useEffect)(() => {
		let last = performance.now();
		const loop = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const s = stateRef.current;
			if (s) {
				if (iAmFighter && s.currentPlayer === mySlot && s.phase === "aiming" && s.winner === null) {
					if (angleHoldRef.current) {
						s.angle = clamp(s.angle + angleHoldRef.current.dir * 45 * dt, 5, 88);
						localEditUntilRef.current = now + 250;
						if (now - lastAimSendRef.current > 60) {
							lastAimSendRef.current = now;
							sendInput({
								k: "angle",
								v: s.angle
							}, true);
						}
					}
					if (powerHoldRef.current) {
						s.power = clamp(s.power + powerHoldRef.current.dir * 55 * dt, 10, 100);
						localEditUntilRef.current = now + 250;
						if (now - lastAimSendRef.current > 60) {
							lastAimSendRef.current = now;
							sendInput({
								k: "power",
								v: s.power
							}, true);
						}
					}
					if (moveHoldRef.current) {
						moveDog(s, moveHoldRef.current.dir, dt);
						if (now - lastMoveSendRef.current > 50) {
							const elapsed = (now - lastMoveSendRef.current) / 1e3;
							lastMoveSendRef.current = now;
							sendInput({
								k: "move",
								dir: moveHoldRef.current.dir,
								dt: Math.min(.2, elapsed)
							}, true);
						}
					}
				}
				if (isHost) {
					step(s, dt);
					if (now - lastSnapshotAtRef.current > 100) {
						lastSnapshotAtRef.current = now;
						netRef.current?.send({
							t: "snapshot",
							state: serialize(s)
						});
					}
					if (s.phase === "aiming" && s.currentPlayer !== lastBroadcastTurnRef.current) {
						lastBroadcastTurnRef.current = s.currentPlayer;
						netRef.current?.send({
							t: "turn",
							slot: s.currentPlayer,
							wind: s.wind
						});
						updateMatch(match.id, {
							current_slot: s.currentPlayer,
							turn_slot: s.currentPlayer
						}).catch(() => {});
					}
					if (s.phase === "aiming" && now - lastTurnBeatRef.current > 1e3) {
						lastTurnBeatRef.current = now;
						netRef.current?.send({
							t: "turn",
							slot: s.currentPlayer,
							wind: s.wind
						});
					}
				} else advanceCosmetic(s, dt);
				const ctx = canvasRef.current?.getContext("2d");
				if (ctx) render(ctx, s);
				setTick((t) => (t + 1) % 1e3);
			}
			rafRef.current = requestAnimationFrame(loop);
		};
		rafRef.current = requestAnimationFrame(loop);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [
		isHost,
		iAmFighter,
		mySlot
	]);
	(0, import_react.useEffect)(() => {
		if (!isHost) return;
		const iv = setInterval(() => {
			const s = stateRef.current;
			if (s && s.phase === "gameover" && match.status !== "ended") updateMatch(match.id, {
				status: "ended",
				ended_at: (/* @__PURE__ */ new Date()).toISOString()
			}).catch(() => {});
		}, 1e3);
		return () => clearInterval(iv);
	}, [
		isHost,
		match.id,
		match.status
	]);
	function onNetEvent(ev) {
		const s = stateRef.current;
		if (!s) {
			if (ev.t === "snapshot") pendingSnapshotRef.current = ev.state;
			else if (ev.t === "turn") pendingTurnRef.current = {
				slot: ev.slot,
				wind: ev.wind
			};
			return;
		}
		if (ev.t === "snapshot" && !isHost) {
			const skipAim = iAmFighter && ev.state.currentPlayer === mySlot && performance.now() < localEditUntilRef.current;
			apply(s, ev.state, skipAim);
		} else if (ev.t === "explosion" && !isHost) {
			const key = fp(ev.x, ev.y, ev.r);
			if (!seenExplosionsRef.current.has(key)) {
				seenExplosionsRef.current.add(key);
				destroyTerrain(s, ev.x, ev.y, ev.r);
				s.scorchMarks.push({
					x: ev.x,
					y: ev.y,
					radius: ev.r * 1.05,
					life: 6,
					maxLife: 6
				});
			}
		} else if (ev.t === "turn" && !isHost) {
			s.currentPlayer = ev.slot === 0 ? 0 : 1;
			s.wind = ev.wind;
			s.phase = "aiming";
			localEditUntilRef.current = 0;
		} else if (ev.t === "input" && isHost) {
			if (ev.slot !== s.currentPlayer) return;
			applyAction(s, ev.action);
		}
	}
	function applyAction(s, a) {
		if (a.k === "angle") s.angle = clamp(a.v, 5, 88);
		else if (a.k === "power") s.power = clamp(a.v, 10, 100);
		else if (a.k === "weapon") setWeapon(s, a.v);
		else if (a.k === "move") moveDog(s, a.dir, a.dt);
		else if (a.k === "jump") jumpDog(s);
		else if (a.k === "fire") fire(s);
		else if (a.k === "barrage") triggerCanineBarrage(s);
		else if (a.k === "shield") activateShield(s);
	}
	const sendInput = (action, localAlreadyApplied = false) => {
		const s = stateRef.current;
		if (!s) return;
		if (s.currentPlayer !== mySlot) return;
		if (!localAlreadyApplied) {
			if (action.k === "angle" || action.k === "power" || action.k === "weapon") {
				applyAction(s, action);
				localEditUntilRef.current = performance.now() + 250;
			} else if (!isHost && (action.k === "move" || action.k === "jump")) applyAction(s, action);
			else if (isHost) applyAction(s, action);
		}
		if (!isHost) netRef.current?.send({
			t: "input",
			slot: mySlot,
			action
		});
	};
	(0, import_react.useEffect)(() => {
		if (!iAmFighter) return;
		const onDown = (e) => {
			const tag = (document.activeElement?.tagName || "").toLowerCase();
			if (tag === "input" || tag === "textarea") return;
			if (e.repeat) return;
			if (e.code === "ArrowLeft" || e.code === "KeyA") {
				e.preventDefault();
				moveHoldRef.current = { dir: -1 };
			} else if (e.code === "ArrowRight" || e.code === "KeyD") {
				e.preventDefault();
				moveHoldRef.current = { dir: 1 };
			} else if (e.code === "ArrowUp" || e.code === "KeyW") {
				e.preventDefault();
				angleHoldRef.current = { dir: 1 };
			} else if (e.code === "ArrowDown" || e.code === "KeyS") {
				e.preventDefault();
				angleHoldRef.current = { dir: -1 };
			} else if (e.code === "KeyQ") {
				e.preventDefault();
				powerHoldRef.current = { dir: -1 };
			} else if (e.code === "KeyE") {
				e.preventDefault();
				powerHoldRef.current = { dir: 1 };
			} else if (e.code === "Space") {
				e.preventDefault();
				sendInput({ k: "jump" });
			} else if (e.code === "Enter") {
				e.preventDefault();
				sendInput({ k: "fire" });
			}
		};
		const onUp = (e) => {
			if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "KeyA" || e.code === "KeyD") moveHoldRef.current = null;
			if (e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "KeyW" || e.code === "KeyS") angleHoldRef.current = null;
			if (e.code === "KeyQ" || e.code === "KeyE") powerHoldRef.current = null;
		};
		window.addEventListener("keydown", onDown);
		window.addEventListener("keyup", onUp);
		return () => {
			window.removeEventListener("keydown", onDown);
			window.removeEventListener("keyup", onUp);
		};
	}, [iAmFighter, mySlot]);
	const s = stateRef.current;
	const myTurn = !!(s && iAmFighter && s.currentPlayer === mySlot && s.phase === "aiming" && s.winner === null);
	const currentName = s ? CHARACTERS[s.dogs[s.currentPlayer].charId].name : "";
	const currentWeapon = s ? WEAPONS[s.weapon] : null;
	const hudVisible = !!(s && s.phase === "aiming" && s.winner === null);
	const hudReserve = s?.hudReserve ?? 148;
	const hudCssPxRaw = displaySize.h && s ? displaySize.h * hudReserve / s.height : 0;
	const hudMinPx = displaySize.w > 0 && displaySize.w < 720 ? 76 : 92;
	const hudCssPx = Math.max(hudCssPxRaw, hudMinPx);
	(0, import_react.useEffect)(() => {
		if (!myTurn && arsenalOpen) setArsenalOpen(false);
	}, [myTurn, arsenalOpen]);
	if (fighters.length < 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 flex items-center justify-center bg-background flex-col gap-3 p-6 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "stencil text-warn",
			children: "Precisa de 2 combatentes nos slots 1 e 2 para começar."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: onExit,
			className: "btn-hud",
			children: "Voltar"
		})]
	});
	const sc = SCENARIOS.find((x) => x.id === match.scenario);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 flex flex-col overflow-hidden bg-background touch-none select-none",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: frameRef,
			className: "relative flex-1 min-h-0 flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				style: displaySize.w > 0 ? {
					width: displaySize.w,
					height: displaySize.h
				} : void 0,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: canvasRef,
						className: "block",
						style: { touchAction: "none" }
					}),
					s && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute top-0 left-0 right-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start p-2 sm:p-3 gap-2 pointer-events-none",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5 pointer-events-auto",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniPlayer, {
									dog: s.dogs[0],
									active: s.currentPlayer === 0
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniPlayer, {
									dog: s.dogs[1],
									active: s.currentPlayer === 1
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-center gap-1 justify-self-center min-w-0 max-w-full pointer-events-auto",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchCountdown, {
									matchDuration: s.matchDuration,
									matchTimer: s.matchTimer
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel px-2 py-1.5 sm:px-3 text-center min-w-0 max-w-full",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "stencil text-[10px] text-muted-foreground uppercase tracking-[0.2em]",
											children: s.phase === "gameover" ? "Fim de combate" : `Turno ${currentName}`
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs sm:text-sm font-semibold mt-0.5 leading-tight",
											children: iAmFighter && s.currentPlayer === mySlot ? `Sua vez — ${currentName}` : `Vez de ${currentName}`
										}),
										s.phase === "aiming" && s.winner === null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground mt-0.5",
											children: iAmFighter && s.currentPlayer !== mySlot ? "Aguardando oponente…" : `Turno ${Math.max(0, Math.ceil(s.turnTimer))}s`
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-end gap-1.5 pointer-events-auto min-w-0 justify-self-end",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => setAimAssistState((v) => !v),
										className: `btn-hud text-[10px] px-2 py-1 ${aimAssist ? "is-selected" : "opacity-70"}`,
										"aria-pressed": aimAssist,
										title: "Mira assistida",
										children: ["🎯 ", aimAssist ? "Mira ON" : "Mira OFF"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: onExit,
										className: "btn-hud text-[10px] px-2 py-1",
										children: "Sair"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WindGauge, { wind: s.wind })]
							})
						]
					}),
					s && s.phase !== "gameover" && hudCssPx > 0 && iAmFighter && currentWeapon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-x-0 bottom-0 px-2 pb-2 pt-1 sm:px-3 sm:pb-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-end",
						style: {
							height: hudCssPx,
							opacity: hudVisible ? 1 : .85
						},
						"aria-hidden": !hudVisible,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-row items-stretch gap-1 sm:gap-2 flex-nowrap w-full",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "shrink-0 [&>button]:!px-1.5 [&>button]:!text-[10px] sm:[&>button]:!px-3 sm:[&>button]:!text-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArsenalPopup, {
										open: arsenalOpen,
										onToggle: () => setArsenalOpen((v) => {
											if (v) setHoveredWeapon(null);
											return !v;
										}),
										current: s.weapon,
										ammo: s.ammo,
										hovered: hoveredWeapon,
										setHovered: setHoveredWeapon,
										disabled: !myTurn,
										onSelect: (id) => {
											sendInput({
												k: "weapon",
												v: id
											});
											setArsenalOpen(false);
											setHoveredWeapon(null);
										}
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobilityBar, {
									dog: s.dogs[s.currentPlayer],
									disabled: !myTurn,
									onHold: (dir) => {
										moveHoldRef.current = { dir };
									},
									onRelease: () => {
										moveHoldRef.current = null;
									},
									onJump: () => sendInput({ k: "jump" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `panel px-2 py-1.5 flex-1 min-w-[150px] sm:min-w-[200px] flex items-center gap-2 ${hudVisible ? "" : "opacity-70"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1 shrink-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoldButton, {
													disabled: !myTurn,
													onHold: (dir) => {
														angleHoldRef.current = { dir };
													},
													onRelease: () => angleHoldRef.current = null,
													dir: -1,
													children: "−"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col items-center min-w-[38px]",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "stencil text-[9px] text-muted-foreground leading-none",
														children: "ÂNG"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "stencil text-base leading-tight",
														style: { color: "var(--accent)" },
														children: [Math.round(s.angle), "°"]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoldButton, {
													disabled: !myTurn,
													onHold: (dir) => {
														angleHoldRef.current = { dir };
													},
													onRelease: () => angleHoldRef.current = null,
													dir: 1,
													children: "+"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hud-divider" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1 flex-1 min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoldButton, {
													disabled: !myTurn,
													onHold: (dir) => {
														powerHoldRef.current = { dir };
													},
													onRelease: () => powerHoldRef.current = null,
													dir: -1,
													children: "−"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col flex-1 min-w-0 gap-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between items-baseline",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "stencil text-[9px] text-muted-foreground leading-none",
															children: "FORÇA"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "stencil text-xs leading-none",
															style: { color: "var(--accent)" },
															children: Math.round(s.power)
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-2 rounded-full bg-black/40 overflow-hidden border border-white/5",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-full transition-[width] duration-75 rounded-full",
															style: {
																width: `${s.power}%`,
																background: `linear-gradient(90deg, var(--team-green), var(--accent) 60%, var(--destructive))`,
																boxShadow: "0 0 8px rgba(255,180,80,0.5)"
															}
														})
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoldButton, {
													disabled: !myTurn,
													onHold: (dir) => {
														powerHoldRef.current = { dir };
													},
													onRelease: () => powerHoldRef.current = null,
													dir: 1,
													children: "+"
												})
											]
										})
									]
								}),
								(() => {
									const dog = s.dogs[s.currentPlayer];
									const pct = Math.max(0, Math.min(100, dog.specialCharge));
									const ready = pct >= 65;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel px-1.5 py-1 sm:px-2 sm:py-1.5 flex flex-col items-center gap-1 shrink-0 w-[60px] sm:w-[74px] md:w-[86px]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[8px] uppercase tracking-widest text-muted-foreground/80 w-full text-center truncate",
												children: "Bombardeio"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												disabled: !myTurn || !ready || s.phase !== "aiming",
												onClick: () => sendInput({ k: "barrage" }),
												className: `relative w-full py-1 sm:py-1.5 rounded text-[9px] sm:text-[11px] stencil tracking-widest border transition ${ready ? "border-amber-300 text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 animate-pulse shadow-[0_0_10px_rgba(255,200,60,0.6)]" : "border-white/15 text-muted-foreground/80 bg-white/5"} disabled:cursor-not-allowed`,
												"aria-label": "Bombardeio Canino",
												title: ready ? "Bombardeio Canino pronto!" : "Acerte tiros para carregar",
												children: ready ? "💣 GO" : `💣 ${Math.floor(pct)}%`
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-full h-1 sm:h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/5",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-full rounded-full transition-[width] duration-150",
													style: {
														width: `${pct}%`,
														background: ready ? "linear-gradient(90deg,#ffdc4a,#ff8a1a)" : "linear-gradient(90deg,#7a4a1a,#ffb84a)",
														boxShadow: ready ? "0 0 8px rgba(255,200,60,0.7)" : void 0
													}
												})
											})
										]
									});
								})(),
								(() => {
									const dog = s.dogs[s.currentPlayer];
									const pct = Math.max(0, Math.min(100, dog.shieldCharge));
									const sosOk = dog.hp / dog.maxHp <= .35 && pct >= 25;
									const fullOk = pct >= 55;
									const ready = (fullOk || sosOk) && !dog.shieldActive;
									const active = dog.shieldActive;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel px-1.5 py-1 sm:px-2 sm:py-1.5 flex flex-col items-center gap-1 shrink-0 w-[60px] sm:w-[74px] md:w-[86px]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[8px] uppercase tracking-widest text-muted-foreground/80 w-full text-center truncate",
												children: "Escudo"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												disabled: !myTurn || active || !ready || s.phase !== "aiming",
												onClick: () => sendInput({ k: "shield" }),
												className: `relative w-full py-1 sm:py-1.5 rounded text-[9px] sm:text-[11px] stencil tracking-widest border transition ${active ? "border-cyan-200 text-cyan-100 bg-cyan-500/25 shadow-[0_0_10px_rgba(120,220,255,0.7)]" : ready ? "border-cyan-300 text-cyan-100 bg-cyan-500/20 hover:bg-cyan-500/30 animate-pulse shadow-[0_0_10px_rgba(120,220,255,0.55)]" : "border-white/15 text-muted-foreground/80 bg-white/5"} disabled:cursor-not-allowed`,
												"aria-label": "Campo de Força",
												title: active ? "Escudo ativo" : ready ? sosOk && !fullOk ? "SOS disponível (HP baixo)" : "Escudo pronto" : "Recebendo dano carrega a barra",
												children: active ? "🛡️ ON" : ready ? "🛡️ GO" : `🛡️ ${Math.floor(pct)}%`
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "w-full h-1 sm:h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/5 relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-full rounded-full transition-[width] duration-150",
													style: {
														width: `${pct}%`,
														background: ready ? "linear-gradient(90deg,#7ee8ff,#38a8ff)" : "linear-gradient(90deg,#1a4a6a,#7ee8ff)",
														boxShadow: ready ? "0 0 8px rgba(120,220,255,0.7)" : void 0
													}
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "absolute top-0 h-full w-px bg-white/60",
													style: { left: `55%` }
												})]
											})
										]
									});
								})(),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: !myTurn,
									onClick: () => sendInput({ k: "fire" }),
									"aria-label": "Atirar",
									className: "fire-btn !w-11 !h-11 !min-h-[44px] !text-[10px] !rounded-full sm:!w-[4.5rem] sm:!h-[4.5rem] sm:!text-[0.85rem] shrink-0",
									children: "FOGO"
								})
							]
						})
					}),
					s?.phase === "gameover" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel p-5 text-center space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "stencil text-lg uppercase",
								children: s.message
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: onExit,
								className: "btn-hud btn-primary",
								children: "Voltar à base"
							})]
						})
					})
				]
			})
		}), showIntro && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComicIntro, {
				chars,
				scenarioLabel: sc?.label,
				bgImage: sc?.bgImage,
				onDone: () => setShowIntro(false)
			})
		})]
	});
}
function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}
function fp(x, y, r) {
	return `${Math.round(x)},${Math.round(y)},${Math.round(r)}`;
}
function serialize(s) {
	return {
		dogs: s.dogs.map((d) => ({
			x: d.x,
			y: d.y,
			vy: d.vy,
			hp: d.hp,
			facing: d.facing,
			airborne: !!d.airborne,
			moveBudget: d.moveBudget,
			hasJumped: d.hasJumped,
			aliveTicks: d.aliveTicks
		})),
		projectiles: s.projectiles.map((p) => ({
			x: p.x,
			y: p.y,
			vx: p.vx,
			vy: p.vy,
			weapon: p.weapon,
			age: p.age,
			ownerTeam: p.ownerTeam,
			isSub: !!p.isSub,
			trail: p.trail.slice(-12)
		})),
		currentPlayer: s.currentPlayer,
		wind: s.wind,
		angle: s.angle,
		power: s.power,
		weapon: s.weapon,
		phase: s.phase,
		message: s.message,
		winner: s.winner,
		ammo: s.ammo,
		turnTimer: s.turnTimer,
		matchTimer: s.matchTimer
	};
}
function apply(s, snap, skipAim = false) {
	for (let i = 0; i < s.dogs.length; i++) {
		const d = s.dogs[i];
		const sd = snap.dogs[i];
		if (!sd) continue;
		d.x = sd.x;
		d.y = sd.y;
		d.vy = sd.vy;
		d.hp = sd.hp;
		d.facing = sd.facing;
		d.airborne = sd.airborne;
		d.moveBudget = sd.moveBudget;
		d.hasJumped = sd.hasJumped;
		d.aliveTicks = sd.aliveTicks;
	}
	s.projectiles = snap.projectiles.map((p) => ({
		x: p.x,
		y: p.y,
		vx: p.vx,
		vy: p.vy,
		weapon: p.weapon,
		age: p.age,
		ownerTeam: p.ownerTeam,
		trail: p.trail,
		isSub: p.isSub
	}));
	s.currentPlayer = snap.currentPlayer;
	s.wind = snap.wind;
	if (!skipAim) {
		s.angle = snap.angle;
		s.power = snap.power;
		s.weapon = snap.weapon;
	}
	s.phase = snap.phase;
	s.message = snap.message;
	s.winner = snap.winner;
	s.ammo = snap.ammo;
	s.turnTimer = snap.turnTimer;
	s.matchTimer = snap.matchTimer;
}
function advanceCosmetic(s, dt) {
	for (let i = s.explosions.length - 1; i >= 0; i--) {
		const e = s.explosions[i];
		e.age += dt;
		for (const pt of e.particles) {
			pt.vy += 220 * dt;
			pt.x += pt.vx * dt;
			pt.y += pt.vy * dt;
			pt.life -= dt;
		}
		e.particles = e.particles.filter((pt) => pt.life > 0);
		if (e.age > e.maxAge + 1.2) s.explosions.splice(i, 1);
	}
	for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
		const f = s.floatingTexts[i];
		f.vy += 90 * dt;
		f.x += f.vx * dt;
		f.y += f.vy * dt;
		f.life -= dt;
		if (f.life <= 0) s.floatingTexts.splice(i, 1);
	}
	for (let i = s.scorchMarks.length - 1; i >= 0; i--) {
		s.scorchMarks[i].life -= dt;
		if (s.scorchMarks[i].life <= 0) s.scorchMarks.splice(i, 1);
	}
	if (s.airstrikeMarker) {
		s.airstrikeMarker.life -= dt;
		if (s.airstrikeMarker.life <= 0) s.airstrikeMarker = void 0;
	}
}
function MatchPage() {
	const { code } = Route.useParams();
	const navigate = useNavigate();
	const [userId, setUserId] = (0, import_react.useState)(null);
	const [match, setMatch] = (0, import_react.useState)(null);
	const [players, setPlayers] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
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
			for (let i = 0; i < 8; i++) {
				const ps = await fetchPlayers(m.id);
				if (cancelled) return;
				if (ps.length >= 2) {
					setPlayers(ps);
					return;
				}
				setPlayers(ps);
				await new Promise((r) => setTimeout(r, 400));
			}
		})().catch((e) => setError(e instanceof Error ? e.message : "Erro"));
		return () => {
			cancelled = true;
		};
	}, [code]);
	(0, import_react.useEffect)(() => {
		if (!match) return;
		const ch = supabase.channel(`match-meta:${match.id}`).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "matches",
			filter: `id=eq.${match.id}`
		}, (payload) => {
			setMatch(payload.new);
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "match_players",
			filter: `match_id=eq.${match.id}`
		}, async () => {
			const ps = await fetchPlayers(match.id);
			setPlayers(ps);
		}).subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	}, [match]);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-dvh flex items-center justify-center bg-background p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel p-4 max-w-md text-center space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stencil text-warn text-sm",
					children: "Erro"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "btn-hud inline-flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 14 }), " Base"]
				})
			]
		})
	});
	const fighterCount = players.filter((p) => p.slot < 2).length;
	if (!match || !userId || fighterCount < 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh flex flex-col items-center justify-center bg-background gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs text-muted-foreground stencil uppercase tracking-widest",
			children: "Sincronizando combatentes…"
		})]
	});
	if (match.status !== "playing" && match.status !== "ended") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-dvh flex items-center justify-center bg-background p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel p-4 max-w-md text-center space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stencil text-sm uppercase",
				children: "Aguardando início"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/lobby/$code",
				params: { code },
				className: "btn-hud",
				children: "Voltar ao lobby"
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnlineMatch, {
		match,
		players,
		myUserId: userId,
		onExit: () => navigate({ to: "/" })
	});
}
//#endregion
export { MatchPage as component };
