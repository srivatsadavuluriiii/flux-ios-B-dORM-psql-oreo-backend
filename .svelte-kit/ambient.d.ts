
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const NODE_ENV: string;
	export const DATABASE_URL: string;
	export const DATABASE_POOL_MIN: string;
	export const DATABASE_POOL_MAX: string;
	export const DATABASE_TIMEOUT: string;
	export const REDIS_URL: string;
	export const CACHE_TTL_DEFAULT: string;
	export const PORT: string;
	export const HOST: string;
	export const FLUX_VERSION: string;
	export const FLUX_ENV: string;
	export const APP_NAME: string;
	export const APP_VERSION: string;
	export const NEXT_PUBLIC_SUPABASE_URL: string;
	export const SUPABASE_SERVICE_ROLE_KEY: string;
	export const SUPABASE_ANON_KEY: string;
	export const SUPABASE_JWT_SECRET: string;
	export const JWT_SECRET: string;
	export const JWT_EXPIRES_IN: string;
	export const JWT_REFRESH_EXPIRES_IN: string;
	export const GITHUB_CLIENT_ID: string;
	export const GITHUB_CLIENT_SECRET: string;
	export const GOOGLE_CLIENT_ID: string;
	export const GOOGLE_CLIENT_SECRET: string;
	export const GEMINI_API_KEY: string;
	export const GEMINI_MODEL: string;
	export const AI_REQUEST_TIMEOUT: string;
	export const PHONEPE_MERCHANT_ID: string;
	export const PHONEPE_SALT_KEY: string;
	export const PHONEPE_SALT_INDEX: string;
	export const PHONEPE_ENVIRONMENT: string;
	export const PHONEPE_CALLBACK_URL: string;
	export const BLYNK_AUTH_TOKEN: string;
	export const BLYNK_SERVER_URL: string;
	export const IOT_SYNC_INTERVAL: string;
	export const HYPERLEDGER_NETWORK_URL: string;
	export const HYPERLEDGER_CERT_PATH: string;
	export const HYPERLEDGER_CHANNEL_NAME: string;
	export const HYPERLEDGER_CHAINCODE_NAME: string;
	export const UPLOAD_MAX_SIZE: string;
	export const ALLOWED_FILE_TYPES: string;
	export const OCR_MAX_FILE_SIZE: string;
	export const OCR_SUPPORTED_FORMATS: string;
	export const RATE_LIMIT_WINDOW: string;
	export const RATE_LIMIT_MAX_REQUESTS: string;
	export const CORS_ORIGIN: string;
	export const WEBHOOK_SECRET: string;
	export const ENCRYPTION_KEY: string;
	export const LOG_LEVEL: string;
	export const METRICS_RETENTION: string;
	export const ERROR_ALERT_THRESHOLD: string;
	export const PERFORMANCE_ALERT_THRESHOLD: string;
	export const GDPR_COMPLIANCE: string;
	export const DPDP_COMPLIANCE: string;
	export const PCI_DSS_MODE: string;
	export const AUDIT_LOG_RETENTION: string;
	export const DATA_RETENTION_DAYS: string;
	export const RAILWAY_ENVIRONMENT: string;
	export const RAILWAY_API_URL: string;
	export const NVM_INC: string;
	export const TERM_PROGRAM: string;
	export const NODE: string;
	export const NVM_CD_FLAGS: string;
	export const TERM: string;
	export const SHELL: string;
	export const HOMEBREW_REPOSITORY: string;
	export const TMPDIR: string;
	export const CONDA_SHLVL: string;
	export const CONDA_PROMPT_MODIFIER: string;
	export const TERM_PROGRAM_VERSION: string;
	export const GSETTINGS_SCHEMA_DIR_CONDA_BACKUP: string;
	export const ZDOTDIR: string;
	export const CURSOR_TRACE_ID: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const MallocNanoZone: string;
	export const npm_config_local_prefix: string;
	export const NVM_DIR: string;
	export const USER: string;
	export const COMMAND_MODE: string;
	export const CONDA_EXE: string;
	export const SSH_AUTH_SOCK: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const PAGER: string;
	export const PYDEVD_DISABLE_FILE_VALIDATION: string;
	export const _CE_CONDA: string;
	export const PATH: string;
	export const GSETTINGS_SCHEMA_DIR: string;
	export const npm_package_json: string;
	export const _: string;
	export const CONDA_PREFIX: string;
	export const USER_ZDOTDIR: string;
	export const __CFBundleIdentifier: string;
	export const npm_command: string;
	export const PWD: string;
	export const DISABLE_AUTO_UPDATE: string;
	export const npm_lifecycle_event: string;
	export const npm_package_name: string;
	export const LANG: string;
	export const BUNDLED_DEBUGPY_PATH: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const XPC_FLAGS: string;
	export const npm_package_version: string;
	export const _CE_M: string;
	export const XPC_SERVICE_NAME: string;
	export const VSCODE_INJECTION: string;
	export const VSCODE_DEBUGPY_ADAPTER_ENDPOINTS: string;
	export const SHLVL: string;
	export const HOME: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const HOMEBREW_PREFIX: string;
	export const CONDA_PYTHON_EXE: string;
	export const LOGNAME: string;
	export const npm_lifecycle_script: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const BUN_INSTALL: string;
	export const NVM_BIN: string;
	export const CONDA_DEFAULT_ENV: string;
	export const npm_config_user_agent: string;
	export const INFOPATH: string;
	export const HOMEBREW_CELLAR: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const GIT_ASKPASS: string;
	export const npm_node_execpath: string;
	export const COLORTERM: string;
	export const VITE_USER_NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		NODE_ENV: string;
		DATABASE_URL: string;
		DATABASE_POOL_MIN: string;
		DATABASE_POOL_MAX: string;
		DATABASE_TIMEOUT: string;
		REDIS_URL: string;
		CACHE_TTL_DEFAULT: string;
		PORT: string;
		HOST: string;
		FLUX_VERSION: string;
		FLUX_ENV: string;
		APP_NAME: string;
		APP_VERSION: string;
		NEXT_PUBLIC_SUPABASE_URL: string;
		SUPABASE_SERVICE_ROLE_KEY: string;
		SUPABASE_ANON_KEY: string;
		SUPABASE_JWT_SECRET: string;
		JWT_SECRET: string;
		JWT_EXPIRES_IN: string;
		JWT_REFRESH_EXPIRES_IN: string;
		GITHUB_CLIENT_ID: string;
		GITHUB_CLIENT_SECRET: string;
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;
		GEMINI_API_KEY: string;
		GEMINI_MODEL: string;
		AI_REQUEST_TIMEOUT: string;
		PHONEPE_MERCHANT_ID: string;
		PHONEPE_SALT_KEY: string;
		PHONEPE_SALT_INDEX: string;
		PHONEPE_ENVIRONMENT: string;
		PHONEPE_CALLBACK_URL: string;
		BLYNK_AUTH_TOKEN: string;
		BLYNK_SERVER_URL: string;
		IOT_SYNC_INTERVAL: string;
		HYPERLEDGER_NETWORK_URL: string;
		HYPERLEDGER_CERT_PATH: string;
		HYPERLEDGER_CHANNEL_NAME: string;
		HYPERLEDGER_CHAINCODE_NAME: string;
		UPLOAD_MAX_SIZE: string;
		ALLOWED_FILE_TYPES: string;
		OCR_MAX_FILE_SIZE: string;
		OCR_SUPPORTED_FORMATS: string;
		RATE_LIMIT_WINDOW: string;
		RATE_LIMIT_MAX_REQUESTS: string;
		CORS_ORIGIN: string;
		WEBHOOK_SECRET: string;
		ENCRYPTION_KEY: string;
		LOG_LEVEL: string;
		METRICS_RETENTION: string;
		ERROR_ALERT_THRESHOLD: string;
		PERFORMANCE_ALERT_THRESHOLD: string;
		GDPR_COMPLIANCE: string;
		DPDP_COMPLIANCE: string;
		PCI_DSS_MODE: string;
		AUDIT_LOG_RETENTION: string;
		DATA_RETENTION_DAYS: string;
		RAILWAY_ENVIRONMENT: string;
		RAILWAY_API_URL: string;
		NVM_INC: string;
		TERM_PROGRAM: string;
		NODE: string;
		NVM_CD_FLAGS: string;
		TERM: string;
		SHELL: string;
		HOMEBREW_REPOSITORY: string;
		TMPDIR: string;
		CONDA_SHLVL: string;
		CONDA_PROMPT_MODIFIER: string;
		TERM_PROGRAM_VERSION: string;
		GSETTINGS_SCHEMA_DIR_CONDA_BACKUP: string;
		ZDOTDIR: string;
		CURSOR_TRACE_ID: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		MallocNanoZone: string;
		npm_config_local_prefix: string;
		NVM_DIR: string;
		USER: string;
		COMMAND_MODE: string;
		CONDA_EXE: string;
		SSH_AUTH_SOCK: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		PAGER: string;
		PYDEVD_DISABLE_FILE_VALIDATION: string;
		_CE_CONDA: string;
		PATH: string;
		GSETTINGS_SCHEMA_DIR: string;
		npm_package_json: string;
		_: string;
		CONDA_PREFIX: string;
		USER_ZDOTDIR: string;
		__CFBundleIdentifier: string;
		npm_command: string;
		PWD: string;
		DISABLE_AUTO_UPDATE: string;
		npm_lifecycle_event: string;
		npm_package_name: string;
		LANG: string;
		BUNDLED_DEBUGPY_PATH: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		XPC_FLAGS: string;
		npm_package_version: string;
		_CE_M: string;
		XPC_SERVICE_NAME: string;
		VSCODE_INJECTION: string;
		VSCODE_DEBUGPY_ADAPTER_ENDPOINTS: string;
		SHLVL: string;
		HOME: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		HOMEBREW_PREFIX: string;
		CONDA_PYTHON_EXE: string;
		LOGNAME: string;
		npm_lifecycle_script: string;
		VSCODE_GIT_IPC_HANDLE: string;
		BUN_INSTALL: string;
		NVM_BIN: string;
		CONDA_DEFAULT_ENV: string;
		npm_config_user_agent: string;
		INFOPATH: string;
		HOMEBREW_CELLAR: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		GIT_ASKPASS: string;
		npm_node_execpath: string;
		COLORTERM: string;
		VITE_USER_NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
