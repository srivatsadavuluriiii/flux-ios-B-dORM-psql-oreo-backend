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

-- Create user profiles table for extended profile information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Extended profile fields
    bio TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}', -- {"twitter": "username", "linkedin": "profile"}
    
    -- Location information
    country VARCHAR(2), -- ISO country code
    city VARCHAR(100),
    state VARCHAR(100),
    
    -- Preferences for Flux
    expense_categories JSONB DEFAULT '[]', -- Custom expense categories
    default_split_method VARCHAR(20) DEFAULT 'equal' CHECK (default_split_method IN ('equal', 'percentage', 'exact')),
    
    -- App behavior preferences
    auto_categorize_expenses BOOLEAN DEFAULT true,
    smart_notifications BOOLEAN DEFAULT true,
    expense_reminders BOOLEAN DEFAULT true,
    
    -- IoT and automation preferences
    iot_devices_connected JSONB DEFAULT '[]',
    automation_rules JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create trigger for user_profiles updated_at
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create user sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supabase_session_id TEXT,
    
    -- Session details
    device_info JSONB, -- {"device": "iPhone", "os": "iOS 17", "app_version": "1.0.0"}
    ip_address INET,
    user_agent TEXT,
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create trigger for user_sessions updated_at
CREATE TRIGGER trigger_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert migration record
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('001_create_users_table', NOW())
ON CONFLICT (version) DO NOTHING; 