import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaign._missionId-CH12t0CZ.js
var import_jsx_runtime = require_jsx_runtime();
var SplitNotFoundComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "min-h-dvh flex items-center justify-center text-muted-foreground",
	children: ["Missão não encontrada. ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/campaign",
		className: "btn-hud ml-2 text-xs px-2 py-1",
		children: "Voltar"
	})]
});
//#endregion
export { SplitNotFoundComponent as notFoundComponent };
