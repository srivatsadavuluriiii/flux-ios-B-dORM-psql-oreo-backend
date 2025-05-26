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
		client: {start:"_app/immutable/entry/start.C_oPTK4v.js",app:"_app/immutable/entry/app.DIOKdFvt.js",imports:["_app/immutable/entry/start.C_oPTK4v.js","_app/immutable/chunks/C_YWCkBQ.js","_app/immutable/chunks/CtZrJEET.js","_app/immutable/entry/app.DIOKdFvt.js","_app/immutable/chunks/CtZrJEET.js","_app/immutable/chunks/CVELKjlE.js","_app/immutable/chunks/Bm-mCaVe.js","_app/immutable/chunks/C9cjNo6P.js","_app/immutable/chunks/CZjYOHzw.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-DyGqIx6L.js')),
			__memo(() => import('./chunks/1-C3vRWaAX.js')),
			__memo(() => import('./chunks/2-BRMvflrh.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-DfOCzcCC.js'))
			},
			{
				id: "/api/v1/auth/oauth",
				pattern: /^\/api\/v1\/auth\/oauth\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DpktJC9m.js'))
			},
			{
				id: "/api/v1/auth/oauth/github",
				pattern: /^\/api\/v1\/auth\/oauth\/github\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DkDhJZeG.js'))
			},
			{
				id: "/api/v1/auth/oauth/github/callback",
				pattern: /^\/api\/v1\/auth\/oauth\/github\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Vijf2du-.js'))
			},
			{
				id: "/api/v1/auth/oauth/google",
				pattern: /^\/api\/v1\/auth\/oauth\/google\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CcyvjH0f.js'))
			},
			{
				id: "/api/v1/auth/oauth/google/callback",
				pattern: /^\/api\/v1\/auth\/oauth\/google\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BXJjVjjR.js'))
			},
			{
				id: "/api/v1/auth/profile",
				pattern: /^\/api\/v1\/auth\/profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cc77jnHs.js'))
			},
			{
				id: "/api/v1/auth/refresh",
				pattern: /^\/api\/v1\/auth\/refresh\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BO6OZbPQ.js'))
			},
			{
				id: "/api/v1/auth/signin",
				pattern: /^\/api\/v1\/auth\/signin\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BBODGTZw.js'))
			},
			{
				id: "/api/v1/auth/signup",
				pattern: /^\/api\/v1\/auth\/signup\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-7zuKXrdA.js'))
			},
			{
				id: "/api/v1/auth/sync-user",
				pattern: /^\/api\/v1\/auth\/sync-user\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CkGUVC1s.js'))
			},
			{
				id: "/api/v1/auth/webhook",
				pattern: /^\/api\/v1\/auth\/webhook\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BUUNKmop.js'))
			},
			{
				id: "/api/v1/expenses",
				pattern: /^\/api\/v1\/expenses\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C9WrCSb4.js'))
			},
			{
				id: "/api/v1/expenses/analytics",
				pattern: /^\/api\/v1\/expenses\/analytics\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bmq4EQpK.js'))
			},
			{
				id: "/api/v1/expenses/categories",
				pattern: /^\/api\/v1\/expenses\/categories\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DoIUedWI.js'))
			},
			{
				id: "/api/v1/expenses/[id]",
				pattern: /^\/api\/v1\/expenses\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C-ffKHf-.js'))
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
