-- Migration: 000_create_migrations_table.sql
-- Description: Create schema_migrations table to track database migrations

-- Create schema_migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);

-- Insert the initial migration record
INSERT INTO schema_migrations (version, description, applied_at) 
VALUES ('000_create_migrations_table', 'Create schema migrations tracking table', NOW())
ON CONFLICT (version) DO NOTHING; 