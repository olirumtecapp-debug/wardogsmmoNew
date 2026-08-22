//#region node_modules/.nitro/vite/services/ssr/assets/characters-DgQbMrji.js
var WEAPONS = {
	bazooka: {
		id: "bazooka",
		name: "Bazuca",
		damage: 45,
		radius: 44,
		ammo: -1,
		speed: 12,
		kind: "ballistic",
		affectedByWind: true,
		color: "#ff7a1a",
		accent: "#ffd166",
		gravityScale: 1
	},
	grenade: {
		id: "grenade",
		name: "Granada",
		damage: 55,
		radius: 55,
		ammo: 3,
		speed: 10,
		kind: "cluster",
		affectedByWind: true,
		color: "#8fbc55",
		accent: "#f4d02c",
		gravityScale: 1,
		fuse: 2.5
	},
	rpg: {
		id: "rpg",
		name: "RPG",
		damage: 55,
		radius: 55,
		ammo: 3,
		speed: 11,
		kind: "ballistic",
		affectedByWind: false,
		color: "#2b7fff",
		accent: "#7ff0ff",
		gravityScale: .15
	},
	bow: {
		id: "bow",
		name: "Arco & Flecha",
		damage: 30,
		radius: 22,
		ammo: -1,
		speed: 14,
		kind: "ballistic",
		affectedByWind: true,
		color: "#c8f77d",
		accent: "#ff4d9e",
		gravityScale: .65
	},
	artillery: {
		id: "artillery",
		name: "Artilharia",
		damage: 70,
		radius: 70,
		ammo: 2,
		speed: 14,
		kind: "ballistic",
		affectedByWind: true,
		color: "#e94560",
		accent: "#ffcc33",
		gravityScale: 1.2
	},
	frag: {
		id: "frag",
		name: "Frag Rápida",
		damage: 50,
		radius: 38,
		ammo: 4,
		speed: 12,
		kind: "cluster",
		affectedByWind: true,
		color: "#a0e070",
		accent: "#ffe040",
		gravityScale: 1,
		fuse: 1
	},
	cluster: {
		id: "cluster",
		name: "Cluster",
		damage: 32,
		radius: 32,
		ammo: 2,
		speed: 12,
		kind: "cluster",
		affectedByWind: true,
		color: "#ff5aa8",
		accent: "#ffe040",
		gravityScale: 1
	},
	airstrike: {
		id: "airstrike",
		name: "Air Strike",
		damage: 55,
		radius: 50,
		ammo: 1,
		speed: 0,
		kind: "airstrike",
		affectedByWind: false,
		color: "#ff2a2a",
		accent: "#ffdc4a",
		gravityScale: 0
	},
	teleport: {
		id: "teleport",
		name: "Teletransporte",
		damage: 0,
		radius: 0,
		ammo: 2,
		speed: 0,
		kind: "utility",
		affectedByWind: false,
		color: "#38f0ff",
		accent: "#c0f8ff",
		gravityScale: 0
	}
};
var WEAPON_ORDER = [
	"bazooka",
	"grenade",
	"rpg",
	"bow",
	"artillery",
	"frag",
	"cluster",
	"airstrike",
	"teleport"
];
function initialAmmo() {
	const out = {};
	for (const id of WEAPON_ORDER) out[id] = WEAPONS[id].ammo;
	return out;
}
var RANGER = {
	name: "RANGER",
	silhouette: "pointy",
	bodyLight: "#d2a06d",
	bodyBase: "#a76a2c",
	bodyDark: "#2a1a0c",
	teamColor: "#ff8a1a",
	teamDark: "#a04a10",
	helmetBase: "#0f0f12",
	helmetTop: "#2a2a30",
	badgeColor: "#e0b64a",
	eyeIris: "#ffb84a",
	teamNum: "01",
	badgeGlyph: "★"
};
var BRUTUS = {
	name: "BRUTUS",
	silhouette: "stocky",
	bodyLight: "#efe4d6",
	bodyBase: "#b57548",
	bodyDark: "#5a3120",
	teamColor: "#ff4838",
	teamDark: "#a02420",
	helmetBase: "#3d4a2a",
	helmetTop: "#6b7a44",
	badgeColor: "#d8d3c9",
	eyeIris: "#e2a24a",
	teamNum: "02",
	badgeGlyph: "■"
};
function weaponColor(id) {
	return WEAPONS[id].color;
}
function weaponAccent(id) {
	return WEAPONS[id].accent ?? WEAPONS[id].color;
}
var wardogs_ranger_front_v2_png_asset_default = {
	version: 1,
	asset_id: "afefb00a-aa88-4d34-9ca1-e765d9c7e462",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/afefb00a-aa88-4d34-9ca1-e765d9c7e462/wardogs-ranger-front-v2.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/afefb00a-aa88-4d34-9ca1-e765d9c7e462/wardogs-ranger-front-v2.png",
	original_filename: "wardogs-ranger-front-v2.png",
	size: 1225121,
	content_type: "image/png",
	created_at: "2026-07-22T01:36:07Z"
};
var wardogs_brutus_front_v2_png_asset_default = {
	version: 1,
	asset_id: "fba3047a-b73d-406b-9ba3-85de2ab91354",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/fba3047a-b73d-406b-9ba3-85de2ab91354/wardogs-brutus-front-v2.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/fba3047a-b73d-406b-9ba3-85de2ab91354/wardogs-brutus-front-v2.png",
	original_filename: "wardogs-brutus-front-v2.png",
	size: 1322719,
	content_type: "image/png",
	created_at: "2026-07-22T01:36:10Z"
};
var wardogs_musa_front_v8_png_asset_default = {
	version: 1,
	asset_id: "b5d5592f-619c-4426-8a6a-65ce931b045f",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/b5d5592f-619c-4426-8a6a-65ce931b045f/wardogs-musa-front-v8.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/b5d5592f-619c-4426-8a6a-65ce931b045f/wardogs-musa-front-v8.png",
	original_filename: "wardogs-musa-front-v8.png",
	size: 1115644,
	content_type: "image/png",
	created_at: "2026-07-23T19:46:08Z"
};
var wardogs_ozzy_front_v2_png_asset_default = {
	version: 1,
	asset_id: "afa6cef2-65ff-48c6-8a8f-a29f77932437",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/afa6cef2-65ff-48c6-8a8f-a29f77932437/wardogs-ozzy-front-v2.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/afa6cef2-65ff-48c6-8a8f-a29f77932437/wardogs-ozzy-front-v2.png",
	original_filename: "wardogs-ozzy-front-v2.png",
	size: 592815,
	content_type: "image/png",
	created_at: "2026-07-22T01:36:15Z"
};
var corso_front_v5_png_asset_default = {
	version: 1,
	asset_id: "a0f5f1dd-e66e-42b5-99fe-5b22d1950f4a",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/a0f5f1dd-e66e-42b5-99fe-5b22d1950f4a/corso-front-v5.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/a0f5f1dd-e66e-42b5-99fe-5b22d1950f4a/corso-front-v5.png",
	original_filename: "corso-front-v5.png",
	size: 687128,
	content_type: "image/png",
	created_at: "2026-07-22T01:36:18Z"
};
var miu_front_v6_png_asset_default = {
	version: 1,
	asset_id: "a692d1fb-26da-42ff-adbd-e5664a40781b",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/a692d1fb-26da-42ff-adbd-e5664a40781b/miu-front-v6.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/a692d1fb-26da-42ff-adbd-e5664a40781b/miu-front-v6.png",
	original_filename: "miu-front-v6.png",
	size: 976084,
	content_type: "image/png",
	created_at: "2026-07-22T01:36:20Z"
};
var barto_crouch_png_asset_default = {
	version: 1,
	asset_id: "5b8db781-a62e-4eb2-bb0c-64661a752d8c",
	project_id: "17ec0423-0d86-4815-bfd7-dd26c1f5ed41",
	url: "/__l5e/assets-v1/5b8db781-a62e-4eb2-bb0c-64661a752d8c/barto-crouch.png",
	r2_key: "a/v1/17ec0423-0d86-4815-bfd7-dd26c1f5ed41/5b8db781-a62e-4eb2-bb0c-64661a752d8c/barto-crouch.png",
	original_filename: "barto-crouch.png",
	size: 1476930,
	content_type: "image/png",
	created_at: "2026-07-26T12:40:30Z"
};
var MUSA_SKIN = {
	...BRUTUS,
	name: "MUSA",
	silhouette: "stocky",
	teamColor: "#7ab648",
	teamDark: "#3d5a20",
	bodyLight: "#c99a6a",
	bodyBase: "#7a4a24",
	bodyDark: "#2a1508",
	eyeIris: "#e8a24a",
	teamNum: "03",
	badgeGlyph: "◆"
};
var OZZY_SKIN = {
	...RANGER,
	name: "OZZY",
	silhouette: "pointy",
	teamColor: "#3aa0ff",
	teamDark: "#1a4e88",
	bodyLight: "#d38a3a",
	bodyBase: "#8a4a1a",
	bodyDark: "#2a1108",
	teamNum: "04",
	badgeGlyph: "▲"
};
var NEGAO_SKIN = {
	...BRUTUS,
	name: "CORSO",
	silhouette: "stocky",
	teamColor: "#a855f7",
	teamDark: "#5b21b6",
	bodyLight: "#4a4a52",
	bodyBase: "#1a1a1e",
	bodyDark: "#050507",
	helmetBase: "#141418",
	helmetTop: "#2a2a30",
	eyeIris: "#ffcc33",
	teamNum: "05",
	badgeGlyph: "☠"
};
var MIU_SKIN = {
	...RANGER,
	name: "MIU",
	silhouette: "pointy",
	teamColor: "#f472b6",
	teamDark: "#9d174d",
	bodyLight: "#6a6a72",
	bodyBase: "#2a2a30",
	bodyDark: "#0a0a10",
	helmetBase: "#1a1a20",
	helmetTop: "#3a3a44",
	eyeIris: "#7ff0ff",
	teamNum: "06",
	badgeGlyph: "✦"
};
var BARTO_SKIN = {
	...BRUTUS,
	name: "BARTÔ",
	silhouette: "stocky",
	teamColor: "#ff8a1a",
	teamDark: "#7a3a0a",
	bodyLight: "#f5efe5",
	bodyBase: "#d8cfc0",
	bodyDark: "#4a4238",
	helmetBase: "#4a5028",
	helmetTop: "#7a8244",
	eyeIris: "#5a3a1a",
	teamNum: "07",
	badgeGlyph: "✚"
};
var SIZING = {
	ranger: {
		spriteScale: 1.18,
		portraitScale: 1,
		spriteBottomPad: .01
	},
	brutus: {
		spriteScale: 1.2,
		portraitScale: 1,
		spriteBottomPad: .01
	},
	musa: {
		spriteScale: 1.18,
		portraitScale: 1,
		spriteBottomPad: .01
	},
	ozzy: {
		spriteScale: 1.28,
		portraitScale: 1,
		spriteBottomPad: .01
	},
	negao: {
		spriteScale: 1.2,
		portraitScale: 1,
		spriteBottomPad: .01
	},
	miu: {
		spriteScale: 1.32,
		portraitScale: 1,
		spriteBottomPad: .01
	},
	barto: {
		spriteScale: 1.1,
		portraitScale: 1,
		spriteBottomPad: .01
	}
};
var CHARACTERS = {
	ranger: {
		id: "ranger",
		name: "Ranger",
		breed: "Pastor Alemão",
		tagline: "Equilibrado — bom em todo terreno.",
		portraitUrl: wardogs_ranger_front_v2_png_asset_default.url,
		comicPortraitUrl: wardogs_ranger_front_v2_png_asset_default.url,
		stats: {
			hp: 100,
			mobility: 120,
			jump: 1,
			defense: 1
		},
		skin: RANGER,
		tier: "standard",
		sizing: SIZING.ranger
	},
	brutus: {
		id: "brutus",
		name: "Brutus",
		breed: "Bulldog",
		tagline: "Tanque — encaixa dano, se move menos.",
		portraitUrl: wardogs_brutus_front_v2_png_asset_default.url,
		comicPortraitUrl: wardogs_brutus_front_v2_png_asset_default.url,
		stats: {
			hp: 130,
			mobility: 80,
			jump: .8,
			defense: .75
		},
		skin: BRUTUS,
		tier: "standard",
		sizing: SIZING.brutus
	},
	musa: {
		id: "musa",
		name: "Musa",
		breed: "Boxer",
		tagline: "Bruta força — resistente e agressiva.",
		portraitUrl: wardogs_musa_front_v8_png_asset_default.url,
		comicPortraitUrl: wardogs_musa_front_v8_png_asset_default.url,
		stats: {
			hp: 115,
			mobility: 105,
			jump: 1.05,
			defense: .9
		},
		skin: MUSA_SKIN,
		tier: "standard",
		sizing: SIZING.musa
	},
	ozzy: {
		id: "ozzy",
		name: "Ozzy",
		breed: "Pinscher",
		tagline: "Rápido e saltador, mas frágil.",
		portraitUrl: wardogs_ozzy_front_v2_png_asset_default.url,
		comicPortraitUrl: wardogs_ozzy_front_v2_png_asset_default.url,
		stats: {
			hp: 85,
			mobility: 150,
			jump: 1.35,
			defense: 1.2
		},
		skin: OZZY_SKIN,
		tier: "standard",
		sizing: SIZING.ozzy
	},
	negao: {
		id: "negao",
		name: "Corso",
		breed: "Cane Corso · Elite",
		tagline: "Tanque de elite — blindagem pesada e mordida esmagadora.",
		portraitUrl: corso_front_v5_png_asset_default.url,
		comicPortraitUrl: corso_front_v5_png_asset_default.url,
		stats: {
			hp: 150,
			mobility: 90,
			jump: .9,
			defense: .7
		},
		skin: NEGAO_SKIN,
		tier: "elite",
		sizing: SIZING.negao
	},
	miu: {
		id: "miu",
		name: "Miu",
		breed: "Street Cat · Elite",
		tagline: "Assassina felina — rápida, alta e imprevisível.",
		portraitUrl: miu_front_v6_png_asset_default.url,
		comicPortraitUrl: miu_front_v6_png_asset_default.url,
		stats: {
			hp: 95,
			mobility: 170,
			jump: 1.5,
			defense: 1
		},
		skin: MIU_SKIN,
		tier: "elite",
		sizing: SIZING.miu
	},
	barto: {
		id: "barto",
		name: "Bartô",
		breed: "Bulldog Francês · Elite",
		tagline: "Coração de Buldogue — fica mais forte quando está machucado.",
		portraitUrl: barto_crouch_png_asset_default.url,
		comicPortraitUrl: barto_crouch_png_asset_default.url,
		stats: {
			hp: 125,
			mobility: 95,
			jump: .95,
			defense: .8
		},
		skin: BARTO_SKIN,
		tier: "elite",
		sizing: SIZING.barto
	}
};
var CHARACTER_LIST = [
	CHARACTERS.ranger,
	CHARACTERS.brutus,
	CHARACTERS.musa,
	CHARACTERS.ozzy,
	CHARACTERS.negao,
	CHARACTERS.miu,
	CHARACTERS.barto
];
function characterSkin(id) {
	return CHARACTERS[id].skin;
}
function characterBars(id) {
	const s = CHARACTERS[id].stats;
	return {
		hp: Math.min(1, s.hp / 160),
		mob: Math.min(1, s.mobility / 180),
		jump: Math.min(1, s.jump / 1.6),
		def: Math.min(1, (1.3 - s.defense) / .9)
	};
}
//#endregion
export { barto_crouch_png_asset_default as a, initialAmmo as c, WEAPON_ORDER as i, weaponAccent as l, CHARACTER_LIST as n, characterBars as o, WEAPONS as r, characterSkin as s, CHARACTERS as t, weaponColor as u };
