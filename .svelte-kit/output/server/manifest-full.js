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
		client: {start:"_app/immutable/entry/start.Dxd615_V.js",app:"_app/immutable/entry/app.CjrZL-iS.js",imports:["_app/immutable/entry/start.Dxd615_V.js","_app/immutable/chunks/ULVDlRxL.js","_app/immutable/chunks/CtZrJEET.js","_app/immutable/entry/app.CjrZL-iS.js","_app/immutable/chunks/CtZrJEET.js","_app/immutable/chunks/CVELKjlE.js","_app/immutable/chunks/Bm-mCaVe.js","_app/immutable/chunks/C9cjNo6P.js","_app/immutable/chunks/CZjYOHzw.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
				id: "/api/admin/migrate",
				pattern: /^\/api\/admin\/migrate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/migrate/_server.ts.js'))
			},
			{
				id: "/api/database-health",
				pattern: /^\/api\/database-health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/database-health/_server.ts.js'))
			},
			{
				id: "/api/debug/profile-operations",
				pattern: /^\/api\/debug\/profile-operations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/debug/profile-operations/_server.ts.js'))
			},
			{
				id: "/api/debug/user-operations",
				pattern: /^\/api\/debug\/user-operations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/debug/user-operations/_server.ts.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/health/_server.ts.js'))
			},
			{
				id: "/api/health/ping",
				pattern: /^\/api\/health\/ping\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/health/ping/_server.ts.js'))
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
				id: "/api/v1/auth/oauth/link-provider",
				pattern: /^\/api\/v1\/auth\/oauth\/link-provider\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/oauth/link-provider/_server.ts.js'))
			},
			{
				id: "/api/v1/auth/oauth/unlink-provider",
				pattern: /^\/api\/v1\/auth\/oauth\/unlink-provider\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/auth/oauth/unlink-provider/_server.ts.js'))
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
				id: "/api/v1/dashboard",
				pattern: /^\/api\/v1\/dashboard\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/dashboard/_server.ts.js'))
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
				id: "/api/v1/expenses/bulk",
				pattern: /^\/api\/v1\/expenses\/bulk\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/bulk/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses/categories",
				pattern: /^\/api\/v1\/expenses\/categories\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/categories/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses/search",
				pattern: /^\/api\/v1\/expenses\/search\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/search/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses/settle",
				pattern: /^\/api\/v1\/expenses\/settle\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/settle/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses/test",
				pattern: /^\/api\/v1\/expenses\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/test/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses/test/categories",
				pattern: /^\/api\/v1\/expenses\/test\/categories\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/test/categories/_server.ts.js'))
			},
			{
				id: "/api/v1/expenses/[id]",
				pattern: /^\/api\/v1\/expenses\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/expenses/_id_/_server.ts.js'))
			},
			{
				id: "/api/v1/groups/expenses",
				pattern: /^\/api\/v1\/groups\/expenses\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/groups/expenses/_server.ts.js'))
			},
			{
				id: "/api/v1/groups/members",
				pattern: /^\/api\/v1\/groups\/members\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/groups/members/_server.ts.js'))
			},
			{
				id: "/api/v1/settlements",
				pattern: /^\/api\/v1\/settlements\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/settlements/_server.ts.js'))
			},
			{
				id: "/api/v1/test",
				pattern: /^\/api\/v1\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/v1/test/_server.ts.js'))
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
