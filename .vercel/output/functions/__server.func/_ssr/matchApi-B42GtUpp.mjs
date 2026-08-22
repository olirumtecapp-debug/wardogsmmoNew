import { t as supabase } from "./client-Doxa_S3-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/matchApi-B42GtUpp.js
var pending = null;
/**
* Garante uma sessão Supabase (anônima se não houver login).
* Retorna o user_id da sessão. Em caso de erro, limpa o cache para permitir retry.
*/
async function ensureAnonSession() {
	if (pending) return pending;
	const p = (async () => {
		try {
			const { data: session } = await supabase.auth.getSession();
			if (session.session?.user?.id) return { userId: session.session.user.id };
			const { data, error } = await supabase.auth.signInAnonymously();
			if (error || !data.user) {
				console.error("[anon-auth] signInAnonymously falhou:", error);
				return null;
			}
			return { userId: data.user.id };
		} catch (e) {
			console.error("[anon-auth] exceção:", e);
			return null;
		}
	})();
	pending = p;
	const result = await p;
	if (!result) pending = null;
	return result;
}
function randomNickname() {
	const adj = [
		"Alfa",
		"Bravo",
		"Cargo",
		"Delta",
		"Echo",
		"Foxtrot",
		"Ghost",
		"Hunter",
		"Iron",
		"Juliet",
		"Kilo",
		"Lima",
		"Mike",
		"Nova",
		"Oscar",
		"Papa",
		"Quebec",
		"Romeo",
		"Sierra",
		"Tango",
		"Viper",
		"Whisky",
		"Xray",
		"Yankee",
		"Zulu"
	];
	const noun = [
		"Dog",
		"Wolf",
		"Fang",
		"Bark",
		"Bone",
		"Paw",
		"Snarl",
		"Growl",
		"Howl",
		"K9",
		"Sarge",
		"Recon",
		"Bomber",
		"Sniper",
		"Scout"
	];
	const n = Math.floor(Math.random() * 99);
	return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${n}`;
}
function getDeviceKind() {
	if (typeof window === "undefined") return "desktop";
	try {
		const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
		const narrow = window.innerWidth <= 900;
		if (coarse || narrow) return "mobile";
		const ua = navigator.userAgent || "";
		if (/Android|iPhone|iPad|iPod|IEMobile|Mobile/i.test(ua)) return "mobile";
		return "desktop";
	} catch {
		return "desktop";
	}
}
function deviceLabel(kind) {
	return kind === "mobile" ? "Smartphone" : "PC";
}
var DeviceMismatchError = class extends Error {
	hostDevice;
	localDevice;
	code = "DEVICE_MISMATCH";
	constructor(hostDevice, localDevice) {
		super(`Sala criada em ${deviceLabel(hostDevice)}; você está em ${deviceLabel(localDevice)}.`);
		this.hostDevice = hostDevice;
		this.localDevice = localDevice;
		this.name = "DeviceMismatchError";
	}
};
var CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(len = 5) {
	let out = "";
	for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * 32)];
	return out;
}
async function createMatch(opts) {
	const s = await ensureAnonSession();
	if (!s) throw new Error("Sem sessão — recarregue a página e tente novamente");
	const { data: userData, error: userErr } = await supabase.auth.getUser();
	const uid = userData?.user?.id ?? s.userId;
	if (userErr) console.warn("[createMatch] getUser warn:", userErr);
	if (!uid) throw new Error("Sessão inválida");
	const seed = Math.floor(Math.random() * 2147483647);
	const maxPlayers = opts.maxPlayers ?? 4;
	let worldW = 1280;
	let worldH = 720;
	try {
		const w = window.innerWidth;
		const h = window.innerHeight;
		if (window.matchMedia("(pointer: coarse)").matches && h > w) {
			worldW = 900;
			worldH = 1400;
		}
	} catch {}
	let code = "";
	let match = null;
	let lastError = null;
	for (let i = 0; i < 5; i++) {
		code = genCode();
		const { data, error } = await supabase.from("matches").insert({
			code,
			host_id: uid,
			seed,
			scenario: opts.scenario,
			difficulty: opts.difficulty,
			max_players: maxPlayers,
			world_w: worldW,
			world_h: worldH,
			current_slot: 0,
			host_device: getDeviceKind()
		}).select().single();
		if (!error && data) {
			match = data;
			break;
		}
		lastError = error;
		if (error) {
			if (!(`${error.message}`.toLowerCase().includes("duplicate") || error.code === "23505")) {
				console.error("[createMatch] insert matches falhou:", error);
				throw new Error(`Falha ao criar sala: ${error.message}${error.hint ? ` (${error.hint})` : ""}`);
			}
		}
	}
	if (!match) {
		console.error("[createMatch] esgotou tentativas de código:", lastError);
		throw new Error("Não foi possível gerar código único");
	}
	if (typeof sessionStorage !== "undefined" && opts.matchDuration !== void 0) try {
		sessionStorage.setItem(`wardogs.dur.${match.code}`, String(opts.matchDuration));
	} catch {}
	const { error: pErr } = await supabase.from("match_players").insert({
		match_id: match.id,
		user_id: uid,
		slot: 0,
		nickname: opts.nickname,
		char_id: opts.charId
	});
	if (pErr) {
		console.error("[createMatch] insert match_players falhou, revertendo sala:", pErr);
		await supabase.from("matches").delete().eq("id", match.id);
		throw new Error(`Falha ao registrar jogador: ${pErr.message}${pErr.hint ? ` (${pErr.hint})` : ""}`);
	}
	return match;
}
function getStoredMatchDuration(code) {
	if (typeof sessionStorage === "undefined") return void 0;
	try {
		const v = sessionStorage.getItem(`wardogs.dur.${code}`);
		return v === null ? void 0 : Math.max(0, parseInt(v, 10));
	} catch {
		return;
	}
}
async function joinMatchByCode(code, nickname, charId) {
	await ensureAnonSession();
	const cleanCode = code.trim().toUpperCase();
	const { data: pre, error: preErr } = await supabase.from("matches").select("host_device").eq("code", cleanCode).maybeSingle();
	if (preErr) throw preErr;
	const hostDevice = pre?.host_device ?? null;
	if (hostDevice) {
		const local = getDeviceKind();
		if (hostDevice !== local) throw new DeviceMismatchError(hostDevice, local);
	}
	const { data, error } = await supabase.rpc("join_match_by_code", {
		_code: cleanCode,
		_nickname: nickname,
		_char_id: charId
	});
	if (error) throw error;
	const row = Array.isArray(data) ? data[0] : data;
	return {
		matchId: row.match_id,
		slot: row.slot
	};
}
async function fetchMatchByCode(code) {
	const { data, error } = await supabase.from("matches").select("*").eq("code", code.toUpperCase()).maybeSingle();
	if (error) throw error;
	return data;
}
async function fetchPlayers(matchId) {
	const { data, error } = await supabase.from("match_players").select("*").eq("match_id", matchId).order("slot");
	if (error) throw error;
	return data ?? [];
}
async function updateSelfPlayer(matchId, patch) {
	const s = await ensureAnonSession();
	if (!s) throw new Error("Sem sessão");
	const { error } = await supabase.from("match_players").update(patch).eq("match_id", matchId).eq("user_id", s.userId);
	if (error) throw error;
}
async function updateMatch(matchId, patch) {
	const { error } = await supabase.from("matches").update(patch).eq("id", matchId);
	if (error) throw error;
}
async function leaveMatch(matchId) {
	const s = await ensureAnonSession();
	if (!s) return;
	await supabase.from("match_players").delete().eq("match_id", matchId).eq("user_id", s.userId);
}
//#endregion
export { fetchMatchByCode as a, getStoredMatchDuration as c, randomNickname as d, updateMatch as f, ensureAnonSession as i, joinMatchByCode as l, createMatch as n, fetchPlayers as o, updateSelfPlayer as p, deviceLabel as r, getDeviceKind as s, DeviceMismatchError as t, leaveMatch as u };
