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
		client: {start:"_app/immutable/entry/start.Dxd615_V.js",app:"_app/immutable/entry/app.CjrZL-iS.js",imports:["_app/immutable/entry/start.Dxd615_V.js","_app/immutable/chunks/ULVDlRxL.js","_app/immutable/chunks/CtZrJEET.js","_app/immutable/entry/app.CjrZL-iS.js","_app/immutable/chunks/CtZrJEET.js","_app/immutable/chunks/CVELKjlE.js","_app/immutable/chunks/Bm-mCaVe.js","_app/immutable/chunks/C9cjNo6P.js","_app/immutable/chunks/CZjYOHzw.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-DyGqIx6L.js')),
			__memo(() => import('./chunks/1-DVa7-N1N.js')),
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
				id: "/api/admin/migrate",
				pattern: /^\/api\/admin\/migrate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cp8gMjgW.js'))
			},
			{
				id: "/api/database-health",
				pattern: /^\/api\/database-health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-WumPbTeI.js'))
			},
			{
				id: "/api/debug/profile-operations",
				pattern: /^\/api\/debug\/profile-operations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CzmdzfVj.js'))
			},
			{
				id: "/api/debug/user-operations",
				pattern: /^\/api\/debug\/user-operations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DVYAxpld.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BnxmPayl.js'))
			},
			{
				id: "/api/health/ping",
				pattern: /^\/api\/health\/ping\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CxjCWtU4.js'))
			},
			{
				id: "/api/v1/auth/oauth",
				pattern: /^\/api\/v1\/auth\/oauth\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CwBsPhCD.js'))
			},
			{
				id: "/api/v1/auth/oauth/github",
				pattern: /^\/api\/v1\/auth\/oauth\/github\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-2Y2tqbx8.js'))
			},
			{
				id: "/api/v1/auth/oauth/github/callback",
				pattern: /^\/api\/v1\/auth\/oauth\/github\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Djb3j6BM.js'))
			},
			{
				id: "/api/v1/auth/oauth/google",
				pattern: /^\/api\/v1\/auth\/oauth\/google\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BBoCsorw.js'))
			},
			{
				id: "/api/v1/auth/oauth/google/callback",
				pattern: /^\/api\/v1\/auth\/oauth\/google\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CzmO2bRC.js'))
			},
			{
				id: "/api/v1/auth/oauth/link-provider",
				pattern: /^\/api\/v1\/auth\/oauth\/link-provider\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-TirPsl2H.js'))
			},
			{
				id: "/api/v1/auth/oauth/unlink-provider",
				pattern: /^\/api\/v1\/auth\/oauth\/unlink-provider\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dcg95WLl.js'))
			},
			{
				id: "/api/v1/auth/profile",
				pattern: /^\/api\/v1\/auth\/profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-T-jafCCu.js'))
			},
			{
				id: "/api/v1/auth/refresh",
				pattern: /^\/api\/v1\/auth\/refresh\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DSLrQBHn.js'))
			},
			{
				id: "/api/v1/auth/signin",
				pattern: /^\/api\/v1\/auth\/signin\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Si93st9m.js'))
			},
			{
				id: "/api/v1/auth/signup",
				pattern: /^\/api\/v1\/auth\/signup\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DmoDNTWH.js'))
			},
			{
				id: "/api/v1/auth/sync-user",
				pattern: /^\/api\/v1\/auth\/sync-user\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C2ZBs2rG.js'))
			},
			{
				id: "/api/v1/auth/webhook",
				pattern: /^\/api\/v1\/auth\/webhook\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CLUQwzF4.js'))
			},
			{
				id: "/api/v1/dashboard",
				pattern: /^\/api\/v1\/dashboard\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BjBY4ap5.js'))
			},
			{
				id: "/api/v1/expenses",
				pattern: /^\/api\/v1\/expenses\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DQOCrItU.js'))
			},
			{
				id: "/api/v1/expenses/analytics",
				pattern: /^\/api\/v1\/expenses\/analytics\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bgv4iF-f.js'))
			},
			{
				id: "/api/v1/expenses/bulk",
				pattern: /^\/api\/v1\/expenses\/bulk\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-oEPo5CMC.js'))
			},
			{
				id: "/api/v1/expenses/categories",
				pattern: /^\/api\/v1\/expenses\/categories\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BMR4Idjy.js'))
			},
			{
				id: "/api/v1/expenses/search",
				pattern: /^\/api\/v1\/expenses\/search\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DZErd5Gk.js'))
			},
			{
				id: "/api/v1/expenses/settle",
				pattern: /^\/api\/v1\/expenses\/settle\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cax_Mq18.js'))
			},
			{
				id: "/api/v1/expenses/test",
				pattern: /^\/api\/v1\/expenses\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BOGs0dUh.js'))
			},
			{
				id: "/api/v1/expenses/test/categories",
				pattern: /^\/api\/v1\/expenses\/test\/categories\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DyPQhjv5.js'))
			},
			{
				id: "/api/v1/expenses/[id]",
				pattern: /^\/api\/v1\/expenses\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BVgOGr4q.js'))
			},
			{
				id: "/api/v1/groups/expenses",
				pattern: /^\/api\/v1\/groups\/expenses\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D9SbvYR3.js'))
			},
			{
				id: "/api/v1/groups/members",
				pattern: /^\/api\/v1\/groups\/members\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CU5SMO3d.js'))
			},
			{
				id: "/api/v1/settlements",
				pattern: /^\/api\/v1\/settlements\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-lWhGn63U.js'))
			},
			{
				id: "/api/v1/test",
				pattern: /^\/api\/v1\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CuPx5Owf.js'))
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
