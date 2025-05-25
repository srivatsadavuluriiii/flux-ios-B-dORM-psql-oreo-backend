const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.BZBgxlkT.js",app:"_app/immutable/entry/app.DApOlb0Y.js",imports:["_app/immutable/entry/start.BZBgxlkT.js","_app/immutable/chunks/DtBKXpam.js","_app/immutable/chunks/afGwa9RP.js","_app/immutable/chunks/D3CWACNU.js","_app/immutable/entry/app.DApOlb0Y.js","_app/immutable/chunks/afGwa9RP.js","_app/immutable/chunks/DFMJYXZ3.js","_app/immutable/chunks/C9u5aXvY.js","_app/immutable/chunks/D3CWACNU.js","_app/immutable/chunks/Cr_xA6xF.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-CHkxIdKj.js')),
			__memo(() => import('./chunks/1-DXeQX1Ac.js')),
			__memo(() => import('./chunks/2-BzKiq1Lm.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D9UoXP1m.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
