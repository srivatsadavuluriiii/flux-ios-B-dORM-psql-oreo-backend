export const manifest = (() => {
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
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
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
				endpoint: __memo(() => import('./entries/endpoints/api/health/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/oauth",
				pattern: /^\/api\/v1\/auth\/oauth\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/oauth/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/oauth/github",
				pattern: /^\/api\/v1\/auth\/oauth\/github\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/oauth/github/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/oauth/github/callback",
				pattern: /^\/api\/v1\/auth\/oauth\/github\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/oauth/github/callback/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/oauth/google",
				pattern: /^\/api\/v1\/auth\/oauth\/google\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/oauth/google/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/oauth/google/callback",
				pattern: /^\/api\/v1\/auth\/oauth\/google\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/oauth/google/callback/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/profile",
				pattern: /^\/api\/v1\/auth\/profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/profile/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/refresh",
				pattern: /^\/api\/v1\/auth\/refresh\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/refresh/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/signin",
				pattern: /^\/api\/v1\/auth\/signin\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/signin/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/signup",
				pattern: /^\/api\/v1\/auth\/signup\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/signup/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/sync-user",
				pattern: /^\/api\/v1\/auth\/sync-user\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/sync-user/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/webhook",
				pattern: /^\/api\/v1\/auth\/webhook\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/webhook/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses",
				pattern: /^\/api\/v1\/expenses\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses/analytics",
				pattern: /^\/api\/v1\/expenses\/analytics\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/analytics/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses/categories",
				pattern: /^\/api\/v1\/expenses\/categories\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/categories/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses/[id]",
				pattern: /^\/api\/v1\/expenses\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/_id_/_server.ts.js'))
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
