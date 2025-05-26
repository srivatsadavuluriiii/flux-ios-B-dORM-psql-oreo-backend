/**
 * Flux Environment Configuration Loader
 * Automatically selects the appropriate configuration based on FLUX_ENVIRONMENT
 */

interface EnvironmentConfig {
	supabaseUrl: string;
	supabaseAnonKey: string;
	supabaseServiceRoleKey: string;
	databaseUrl: string;
	redisUrl?: string;
	jwtSecret: string;
	environment: 'local' | 'cloud' | 'hybrid';
}

interface FluxConfig extends EnvironmentConfig {
	port: number;
	host: string;
	nodeEnv: string;
	
	// Rate limiting
	rateLimitWindow: number;
	rateLimitMaxRequests: number;
	
	// Cache configuration
	cacheTtlDefault: number;
	cacheTtlAuth: number;
	
	// Feature flags
	enableRedisCache: boolean;
	enableRateLimiting: boolean;
	enableRequestLogging: boolean;
	enableErrorTracking: boolean;
	
	// Debug flags
	debugDatabase: boolean;
	debugAuth: boolean;
	debugCache: boolean;
}

// Predefined configurations
const ENVIRONMENT_CONFIGS = {
	local: {
		supabaseUrl: 'http://127.0.0.1:54321',
		supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
		supabaseServiceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
		databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
		redisUrl: 'redis://127.0.0.1:54379'
	},
	cloud: {
		supabaseUrl: 'https://gkmgdkeigseysfizltlv.supabase.co',
		supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbWdka2VpZ3NleXNmaXpsdGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDg2NDAsImV4cCI6MjA2MzY4NDY0MH0.5zMZu9pOsuywe-ef-ROqKTj5nzaowl0UG7lbyVJjLlc',
		supabaseServiceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbWdka2VpZ3NleXNmaXpsdGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwODY0MCwiZXhwIjoyMDYzNjg0NjQwfQ.6j_SCeTdq8ZFCPo9GN27qiXaNOJBvRqDo_SPYIGfG0Q',
		databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
		redisUrl: 'redis://127.0.0.1:54379'
	},
	hybrid: {
		supabaseUrl: process.env.PRODUCTION_SUPABASE_URL || 'https://gkmgdkeigseysfizltlv.supabase.co',
		supabaseAnonKey: process.env.PRODUCTION_SUPABASE_ANON_KEY || '',
		supabaseServiceRoleKey: process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY || '',
		databaseUrl: process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL || '',
		redisUrl: process.env.RAILWAY_REDIS_URL || process.env.REDIS_URL
	}
};

/**
 * Load Flux configuration based on environment
 */
export function loadFluxConfig(): FluxConfig {
	// Determine environment from FLUX_ENVIRONMENT or fallback to NODE_ENV
	const fluxEnv = (process.env.FLUX_ENVIRONMENT || 'local') as keyof typeof ENVIRONMENT_CONFIGS;
	
	// Validate environment
	if (!ENVIRONMENT_CONFIGS[fluxEnv]) {
		throw new Error(`Invalid FLUX_ENVIRONMENT: ${fluxEnv}. Must be 'local', 'cloud', or 'hybrid'`);
	}
	
	// Get base configuration
	const baseConfig = ENVIRONMENT_CONFIGS[fluxEnv];
	
	// Override with explicit environment variables if provided
	const environmentConfig: EnvironmentConfig = {
		supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || baseConfig.supabaseUrl,
		supabaseAnonKey: process.env.SUPABASE_ANON_KEY || baseConfig.supabaseAnonKey,
		supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || baseConfig.supabaseServiceRoleKey,
		databaseUrl: process.env.DATABASE_URL || baseConfig.databaseUrl,
		redisUrl: process.env.REDIS_URL || baseConfig.redisUrl,
		jwtSecret: process.env.JWT_SECRET || 'aded56cb154ff57a33a2455b295a29b4',
		environment: fluxEnv
	};
	
	// Build complete configuration
	const config: FluxConfig = {
		...environmentConfig,
		
		// Server configuration
		port: parseInt(process.env.PORT || '3000'),
		host: process.env.HOST || '0.0.0.0',
		nodeEnv: process.env.NODE_ENV || 'development',
		
		// Rate limiting
		rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
		rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
		
		// Cache configuration
		cacheTtlDefault: parseInt(process.env.CACHE_TTL_DEFAULT || '3600'),
		cacheTtlAuth: parseInt(process.env.CACHE_TTL_AUTH || '1800'),
		
		// Feature flags
		enableRedisCache: process.env.ENABLE_REDIS_CACHE !== 'false',
		enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
		enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
		enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
		
		// Debug flags
		debugDatabase: process.env.DEBUG_DATABASE === 'true',
		debugAuth: process.env.DEBUG_AUTH === 'true',
		debugCache: process.env.DEBUG_CACHE === 'true'
	};
	
	// Validate required fields
	validateConfig(config);
	
	return config;
}

/**
 * Validate configuration
 */
function validateConfig(config: FluxConfig): void {
	const required = ['supabaseUrl', 'supabaseAnonKey', 'supabaseServiceRoleKey', 'databaseUrl', 'jwtSecret'];
	
	for (const field of required) {
		if (!config[field as keyof FluxConfig]) {
			throw new Error(`Missing required configuration: ${field}`);
		}
	}
	
	// Warn about missing optional fields
	if (!config.redisUrl && config.enableRedisCache) {
		console.warn('[Flux Config] Redis URL not provided, caching will be disabled');
	}
}

/**
 * Get current environment name
 */
export function getCurrentEnvironment(): string {
	return process.env.FLUX_ENVIRONMENT || 'local';
}

/**
 * Check if running in local development
 */
export function isLocalDevelopment(): boolean {
	return getCurrentEnvironment() === 'local';
}

/**
 * Check if running in cloud mode
 */
export function isCloudMode(): boolean {
	return getCurrentEnvironment() === 'cloud';
}

/**
 * Check if running in production/hybrid mode
 */
export function isProductionMode(): boolean {
	return getCurrentEnvironment() === 'hybrid';
}

/**
 * Print current configuration (for debugging)
 */
export function printConfig(): void {
	const config = loadFluxConfig();
	console.log('[Flux Config] Current configuration:');
	console.log(`  Environment: ${config.environment}`);
	console.log(`  Supabase URL: ${config.supabaseUrl}`);
	console.log(`  Database URL: ${config.databaseUrl ? 'configured' : 'missing'}`);
	console.log(`  Redis URL: ${config.redisUrl ? 'configured' : 'missing'}`);
	console.log(`  Port: ${config.port}`);
	console.log(`  Features: Cache=${config.enableRedisCache}, RateLimit=${config.enableRateLimiting}`);
}

// Export the configuration as a singleton
export const FLUX_CONFIG = loadFluxConfig(); 