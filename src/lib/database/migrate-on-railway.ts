/**
 * Railway Migration Script for Flux
 * Runs database migrations on Railway PostgreSQL
 */

import { fluxPostgreSQL } from './postgres.js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
    try {
        console.log('🚀 Starting Flux database migrations on Railway...');

        // Check if migrations table exists
        const createMigrationsTable = `
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        
        await fluxPostgreSQL.query(createMigrationsTable);
        console.log('✅ Migrations table ready');

        // Run 001_create_users_table migration
        const usersTableMigration = `
            -- Migration: 001_create_users_table.sql
            -- Description: Create users table in Railway PostgreSQL for Flux app data
            -- This syncs with Supabase Auth but stores additional app-specific user data

            -- Create users table for Railway PostgreSQL
            CREATE TABLE IF NOT EXISTS users (
                -- Primary identifiers
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                supabase_user_id UUID UNIQUE NOT NULL, -- Links to Supabase Auth user
                
                -- Basic user information
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(100),
                display_name VARCHAR(50),
                avatar_url TEXT,
                
                -- Profile information
                phone VARCHAR(20),
                date_of_birth DATE,
                timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
                language VARCHAR(10) DEFAULT 'en',
                currency VARCHAR(3) DEFAULT 'INR',
                
                -- App-specific settings
                notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
                privacy_settings JSONB DEFAULT '{"profile_visibility": "friends", "expense_sharing": "groups"}',
                
                -- OAuth provider information
                oauth_providers TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['github', 'google']
                github_username VARCHAR(100),
                google_profile_id VARCHAR(100),
                
                -- App usage tracking
                last_active_at TIMESTAMP WITH TIME ZONE,
                total_expenses_count INTEGER DEFAULT 0,
                total_groups_count INTEGER DEFAULT 0,
                
                -- Verification and status
                email_verified BOOLEAN DEFAULT false,
                phone_verified BOOLEAN DEFAULT false,
                account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
                
                -- Compliance and security
                gdpr_consent BOOLEAN DEFAULT false,
                dpdp_consent BOOLEAN DEFAULT false,
                terms_accepted_at TIMESTAMP WITH TIME ZONE,
                privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
                
                -- Audit fields
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                deleted_at TIMESTAMP WITH TIME ZONE,
                
                -- Soft delete support
                is_deleted BOOLEAN DEFAULT false
            );

            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
            CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
            CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON users(last_active_at);
            CREATE INDEX IF NOT EXISTS idx_users_oauth_providers ON users USING GIN(oauth_providers);

            -- Create trigger for updated_at
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            CREATE TRIGGER trigger_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Insert migration record
            INSERT INTO schema_migrations (version, applied_at) 
            VALUES ('001_create_users_table', NOW())
            ON CONFLICT (version) DO NOTHING;
        `;

        await fluxPostgreSQL.query(usersTableMigration);
        console.log('✅ Users table migration completed');

        // Run 002_create_expenses_schema migration
        const expensesTableMigration = `
            -- Create expense categories table
            CREATE TABLE IF NOT EXISTS expense_categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon_name VARCHAR(50),
                color_hex VARCHAR(7),
                parent_category_id UUID REFERENCES expense_categories(id),
                is_system_category BOOLEAN DEFAULT false,
                created_by_user_id UUID REFERENCES users(id),
                is_public BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(name, created_by_user_id)
            );

            CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_category_id);
            CREATE INDEX IF NOT EXISTS idx_expense_categories_user ON expense_categories(created_by_user_id);
            CREATE INDEX IF NOT EXISTS idx_expense_categories_system ON expense_categories(is_system_category);

            CREATE TRIGGER trigger_expense_categories_updated_at
                BEFORE UPDATE ON expense_categories
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create groups table
            CREATE TABLE IF NOT EXISTS groups (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(200) NOT NULL,
                description TEXT,
                currency VARCHAR(3) DEFAULT 'INR',
                default_split_method VARCHAR(20) DEFAULT 'equal' CHECK (default_split_method IN ('equal', 'percentage', 'exact')),
                is_public BOOLEAN DEFAULT false,
                join_code VARCHAR(10) UNIQUE,
                created_by_user_id UUID NOT NULL REFERENCES users(id),
                is_active BOOLEAN DEFAULT true,
                archived_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by_user_id);
            CREATE INDEX IF NOT EXISTS idx_groups_join_code ON groups(join_code);

            CREATE TRIGGER trigger_groups_updated_at
                BEFORE UPDATE ON groups
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create group members table
            CREATE TABLE IF NOT EXISTS group_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
                is_active BOOLEAN DEFAULT true,
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                left_at TIMESTAMP WITH TIME ZONE,
                nickname VARCHAR(100),
                notification_preferences JSONB DEFAULT '{"new_expense": true, "settlements": true, "reminders": true}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(group_id, user_id)
            );

            CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
            CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

            CREATE TRIGGER trigger_group_members_updated_at
                BEFORE UPDATE ON group_members
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create expenses table
            CREATE TABLE IF NOT EXISTS expenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                description VARCHAR(500) NOT NULL,
                amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
                currency VARCHAR(3) DEFAULT 'INR',
                category_id UUID REFERENCES expense_categories(id),
                expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
                location VARCHAR(200),
                paid_by_user_id UUID NOT NULL REFERENCES users(id),
                group_id UUID REFERENCES groups(id),
                receipt_url TEXT,
                receipt_filename VARCHAR(255),
                receipt_file_size INTEGER,
                split_method VARCHAR(20) DEFAULT 'equal' CHECK (split_method IN ('equal', 'percentage', 'exact', 'manual')),
                split_data JSONB,
                ocr_text TEXT,
                ocr_confidence DECIMAL(3,2),
                ai_suggested_category_id UUID REFERENCES expense_categories(id),
                ai_confidence DECIMAL(3,2),
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'settled', 'disputed', 'deleted')),
                notes TEXT,
                is_settled BOOLEAN DEFAULT false,
                settled_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                deleted_at TIMESTAMP WITH TIME ZONE,
                is_deleted BOOLEAN DEFAULT false
            );

            CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by_user_id);
            CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
            CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
            CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

            CREATE TRIGGER trigger_expenses_updated_at
                BEFORE UPDATE ON expenses
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create expense splits table
            CREATE TABLE IF NOT EXISTS expense_splits (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id),
                amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
                percentage DECIMAL(5,2),
                is_settled BOOLEAN DEFAULT false,
                settled_at TIMESTAMP WITH TIME ZONE,
                settlement_method VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(expense_id, user_id)
            );

            CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
            CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON expense_splits(user_id);

            CREATE TRIGGER trigger_expense_splits_updated_at
                BEFORE UPDATE ON expense_splits
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Insert default system expense categories
            INSERT INTO expense_categories (name, description, icon_name, color_hex, is_system_category) VALUES
            ('Food & Dining', 'Restaurants, groceries, and food delivery', 'utensils', '#FF6B6B', true),
            ('Transportation', 'Public transport, taxi, fuel, and travel', 'car', '#4ECDC4', true),
            ('Entertainment', 'Movies, games, concerts, and leisure activities', 'gamepad', '#45B7D1', true),
            ('Shopping', 'Clothing, electronics, and general shopping', 'shopping-bag', '#96CEB4', true),
            ('Bills & Utilities', 'Electricity, water, internet, and recurring bills', 'file-text', '#FECA57', true),
            ('Healthcare', 'Medical expenses, pharmacy, and health services', 'heart', '#FF9FF3', true),
            ('Education', 'Books, courses, tuition, and learning materials', 'book', '#54A0FF', true),
            ('Personal Care', 'Haircuts, cosmetics, and personal services', 'user', '#5F27CD', true),
            ('Travel', 'Hotels, flights, and vacation expenses', 'map-pin', '#00D2D3', true),
            ('Gifts & Donations', 'Presents, charity, and special occasions', 'gift', '#FF6348', true),
            ('Home & Garden', 'Furniture, appliances, and home improvement', 'home', '#2ED573', true),
            ('Business', 'Work-related expenses and business costs', 'briefcase', '#747D8C', true),
            ('Technology', 'Software, subscriptions, and tech purchases', 'smartphone', '#3742FA', true),
            ('Sports & Fitness', 'Gym, sports equipment, and fitness activities', 'activity', '#2F3542', true),
            ('Other', 'Miscellaneous expenses', 'more-horizontal', '#A4B0BE', true)
            ON CONFLICT (name, created_by_user_id) DO NOTHING;

            -- Insert migration record
            INSERT INTO schema_migrations (version, applied_at) 
            VALUES ('002_create_expenses_schema', NOW())
            ON CONFLICT (version) DO NOTHING;
        `;

        await fluxPostgreSQL.query(expensesTableMigration);
        console.log('✅ Expenses schema migration completed');

        console.log('🎉 All migrations completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations();
}

export { runMigrations }; 