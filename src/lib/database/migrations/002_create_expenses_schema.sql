-- Migration: 002_create_expenses_schema.sql
-- Description: Create expense management schema for Flux
-- Includes: categories, expenses, groups, group_members, expense_splits, payments

-- Create expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50), -- For UI icons (e.g., 'food', 'transport', 'entertainment')
    color_hex VARCHAR(7), -- Hex color code for UI (e.g., '#FF5733')
    
    -- Category hierarchy support
    parent_category_id UUID REFERENCES expense_categories(id),
    
    -- System vs custom categories
    is_system_category BOOLEAN DEFAULT false, -- System categories cannot be deleted
    created_by_user_id UUID REFERENCES users(id), -- NULL for system categories
    
    -- Visibility and sharing
    is_public BOOLEAN DEFAULT false, -- Can other users see/use this category
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(name, created_by_user_id) -- User cannot have duplicate category names
);

-- Create indexes for expense categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_user ON expense_categories(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_system ON expense_categories(is_system_category);
CREATE INDEX IF NOT EXISTS idx_expense_categories_public ON expense_categories(is_public);

-- Create trigger for expense_categories updated_at
CREATE TRIGGER trigger_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create groups table for expense sharing
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Group settings
    currency VARCHAR(3) DEFAULT 'INR',
    default_split_method VARCHAR(20) DEFAULT 'equal' CHECK (default_split_method IN ('equal', 'percentage', 'exact')),
    
    -- Group visibility and joining
    is_public BOOLEAN DEFAULT false,
    join_code VARCHAR(10) UNIQUE, -- For easy group joining
    
    -- Group creator and admin
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Group status
    is_active BOOLEAN DEFAULT true,
    archived_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for groups
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON groups(join_code);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);
CREATE INDEX IF NOT EXISTS idx_groups_currency ON groups(currency);

-- Create trigger for groups updated_at
CREATE TRIGGER trigger_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create group members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Member role and permissions
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    
    -- Member status
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    -- Member preferences for this group
    nickname VARCHAR(100), -- Display name within this group
    notification_preferences JSONB DEFAULT '{"new_expense": true, "settlements": true, "reminders": true}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(group_id, user_id) -- User can only be in a group once
);

-- Create indexes for group members
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);
CREATE INDEX IF NOT EXISTS idx_group_members_active ON group_members(is_active);

-- Create trigger for group_members updated_at
CREATE TRIGGER trigger_group_members_updated_at
    BEFORE UPDATE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic expense information
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0), -- Support up to 999,999,999.99
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Expense categorization
    category_id UUID REFERENCES expense_categories(id),
    
    -- Expense date and location
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location VARCHAR(200),
    
    -- Who paid and which group (if any)
    paid_by_user_id UUID NOT NULL REFERENCES users(id),
    group_id UUID REFERENCES groups(id), -- NULL for personal expenses
    
    -- Receipt and attachments
    receipt_url TEXT, -- URL to uploaded receipt image
    receipt_filename VARCHAR(255),
    receipt_file_size INTEGER,
    
    -- Expense splitting
    split_method VARCHAR(20) DEFAULT 'equal' CHECK (split_method IN ('equal', 'percentage', 'exact', 'manual')),
    split_data JSONB, -- Store complex split information
    
    -- OCR and AI processing
    ocr_text TEXT, -- Extracted text from receipt
    ocr_confidence DECIMAL(3,2), -- OCR confidence score (0.00 to 1.00)
    ai_suggested_category_id UUID REFERENCES expense_categories(id),
    ai_confidence DECIMAL(3,2), -- AI categorization confidence
    
    -- Expense status and workflow
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'settled', 'disputed', 'deleted')),
    notes TEXT,
    
    -- Settlement tracking
    is_settled BOOLEAN DEFAULT false,
    settled_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false
);

-- Create indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);
CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_settled ON expenses(is_settled);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON expenses(is_deleted);

-- Create trigger for expenses updated_at
CREATE TRIGGER trigger_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create expense splits table for tracking who owes what
CREATE TABLE IF NOT EXISTS expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Split details
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    percentage DECIMAL(5,2), -- For percentage-based splits (0.00 to 100.00)
    
    -- Split status
    is_settled BOOLEAN DEFAULT false,
    settled_at TIMESTAMP WITH TIME ZONE,
    settlement_method VARCHAR(50), -- 'cash', 'digital', 'phonepe', etc.
    
    -- Notes for this specific split
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(expense_id, user_id) -- Each user can only have one split per expense
);

-- Create indexes for expense splits
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_settled ON expense_splits(is_settled);
CREATE INDEX IF NOT EXISTS idx_expense_splits_amount ON expense_splits(amount);

-- Create trigger for expense_splits updated_at
CREATE TRIGGER trigger_expense_splits_updated_at
    BEFORE UPDATE ON expense_splits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create payments table for settlements between users
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Payment participants
    payer_user_id UUID NOT NULL REFERENCES users(id),
    payee_user_id UUID NOT NULL REFERENCES users(id),
    group_id UUID REFERENCES groups(id), -- NULL for direct payments
    
    -- Payment details
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    description TEXT,
    
    -- Payment method and processing
    payment_method VARCHAR(50), -- 'phonepe', 'cash', 'bank_transfer', etc.
    payment_reference VARCHAR(200), -- External payment reference/transaction ID
    
    -- Related expenses (for bulk settlements)
    related_expense_ids UUID[], -- Array of expense IDs this payment settles
    
    -- Payment status and workflow
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'disputed')),
    
    -- PhonePe integration fields
    phonepe_transaction_id VARCHAR(100),
    phonepe_merchant_transaction_id VARCHAR(100),
    phonepe_order_id VARCHAR(100),
    phonepe_payment_url TEXT,
    phonepe_callback_data JSONB,
    
    -- Payment dates
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee ON payments(payee_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_group ON payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_phonepe_tx ON payments(phonepe_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount);

-- Create trigger for payments updated_at
CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
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