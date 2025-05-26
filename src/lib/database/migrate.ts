/**
 * Database Migration Runner for Flux Railway PostgreSQL
 * Handles running migrations in order and tracking applied migrations
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fluxPostgreSQL as db } from './postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
    version: string;
    filename: string;
    sql: string;
    description?: string;
}

export class MigrationRunner {
    private migrationsPath: string;

    constructor() {
        this.migrationsPath = join(__dirname, 'migrations');
    }

    /**
     * Get all migration files sorted by version
     */
    private async getMigrationFiles(): Promise<string[]> {
        try {
            const files = await readdir(this.migrationsPath);
            return files
                .filter(file => file.endsWith('.sql'))
                .sort((a, b) => {
                    const aVersion = a.split('_')[0];
                    const bVersion = b.split('_')[0];
                    return aVersion.localeCompare(bVersion, undefined, { numeric: true });
                });
        } catch (error) {
            console.error('Error reading migrations directory:', error);
            return [];
        }
    }

    /**
     * Load migration content from file
     */
    private async loadMigration(filename: string): Promise<Migration> {
        const filePath = join(this.migrationsPath, filename);
        const content = await readFile(filePath, 'utf-8');
        
        // Extract version from filename (e.g., "001_create_users_table.sql" -> "001_create_users_table")
        const version = filename.replace('.sql', '');
        
        // Extract description from first comment line
        const descriptionMatch = content.match(/-- Description: (.+)/);
        const description = descriptionMatch ? descriptionMatch[1] : '';

        return {
            version,
            filename,
            sql: content,
            description
        };
    }

    /**
     * Check if a migration has already been applied
     */
    private async isMigrationApplied(version: string): Promise<boolean> {
        try {
            const result = await db.query(
                'SELECT version FROM schema_migrations WHERE version = $1',
                [version]
            );
            return result.rows.length > 0;
        } catch (error) {
            // If schema_migrations table doesn't exist, no migrations have been applied
            return false;
        }
    }

    /**
     * Apply a single migration
     */
    private async applyMigration(migration: Migration): Promise<void> {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Execute the migration SQL
            await client.query(migration.sql);
            
            // Record the migration as applied (if not already done in the migration SQL)
            await client.query(
                'INSERT INTO schema_migrations (version, description, applied_at) VALUES ($1, $2, NOW()) ON CONFLICT (version) DO NOTHING',
                [migration.version, migration.description]
            );
            
            await client.query('COMMIT');
            console.log(`✅ Applied migration: ${migration.version} - ${migration.description}`);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Failed to apply migration: ${migration.version}`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Run all pending migrations
     */
    async runMigrations(): Promise<void> {
        console.log('🚀 Starting Flux database migrations...');

        try {
            const migrationFiles = await this.getMigrationFiles();
            
            if (migrationFiles.length === 0) {
                console.log('No migration files found');
                return;
            }

            console.log(`Found ${migrationFiles.length} migration files`);

            for (const filename of migrationFiles) {
                const migration = await this.loadMigration(filename);
                
                if (await this.isMigrationApplied(migration.version)) {
                    console.log(`⏭️  Skipping already applied migration: ${migration.version}`);
                    continue;
                }

                await this.applyMigration(migration);
            }

            console.log('✅ All migrations completed successfully');
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    /**
     * Get list of applied migrations
     */
    async getAppliedMigrations(): Promise<Array<{ version: string; description: string; applied_at: Date }>> {
        try {
            const result = await db.query(
                'SELECT version, description, applied_at FROM schema_migrations ORDER BY applied_at',
                []
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching applied migrations:', error);
            return [];
        }
    }

    /**
     * Check migration status
     */
    async getMigrationStatus(): Promise<void> {
        console.log('📊 Migration Status:');
        
        const migrationFiles = await this.getMigrationFiles();
        const appliedMigrations = await this.getAppliedMigrations();
        const appliedVersions = new Set(appliedMigrations.map(m => m.version));

        for (const filename of migrationFiles) {
            const version = filename.replace('.sql', '');
            const status = appliedVersions.has(version) ? '✅ Applied' : '⏳ Pending';
            const appliedInfo = appliedVersions.has(version) 
                ? `(${appliedMigrations.find(m => m.version === version)?.applied_at})`
                : '';
            
            console.log(`  ${status} ${version} ${appliedInfo}`);
        }
    }
}

// Export singleton instance
export const migrationRunner = new MigrationRunner();

// CLI interface for running migrations
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    
    switch (command) {
        case 'run':
            migrationRunner.runMigrations()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;
        case 'status':
            migrationRunner.getMigrationStatus()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;
        default:
            console.log('Usage: bun run migrate.ts [run|status]');
            process.exit(1);
    }
} 