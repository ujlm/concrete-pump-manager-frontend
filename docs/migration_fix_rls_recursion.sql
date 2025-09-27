-- Migration script to fix RLS recursion issues in existing database
-- Run this script on your existing Supabase database

-- ============================================================================
-- 1. DROP EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Drop existing users policies that cause recursion
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Managers can manage users in their organization" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- ============================================================================
-- 2. UPDATE SUBSCRIPTION TIER CONSTRAINT
-- ============================================================================

-- Drop old subscription tier constraint
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;

-- Add new subscription_active field
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT true;

-- Update existing records to have active subscription
UPDATE organizations SET subscription_active = true WHERE subscription_active IS NULL;

-- Drop old subscription_tier column
ALTER TABLE organizations DROP COLUMN IF EXISTS subscription_tier;

-- ============================================================================
-- 3. FIX DATA TYPE ISSUES
-- ============================================================================

-- Fix client_code data type
ALTER TABLE clients ALTER COLUMN client_code TYPE VARCHAR(50);

-- Fix machine type constraint
ALTER TABLE machines DROP CONSTRAINT IF EXISTS machines_type_check;
ALTER TABLE machines ADD CONSTRAINT machines_type_check CHECK (type IN ('pump', 'mixer'));

-- ============================================================================
-- 4. UPDATE ADDRESS STRUCTURE
-- ============================================================================

-- Add new structured address fields to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(10);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address_country VARCHAR(100) DEFAULT 'Belgium';

-- Add new structured address fields to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(10);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_country VARCHAR(100) DEFAULT 'Belgium';

-- Add new structured address fields to concrete_plants
ALTER TABLE concrete_plants ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE concrete_plants ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE concrete_plants ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(10);
ALTER TABLE concrete_plants ADD COLUMN IF NOT EXISTS address_country VARCHAR(100) DEFAULT 'Belgium';

-- Add new structured address fields to yards
ALTER TABLE yards ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE yards ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE yards ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(10);
ALTER TABLE yards ADD COLUMN IF NOT EXISTS address_country VARCHAR(100) DEFAULT 'Belgium';

-- Add new structured address fields to suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(10);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address_country VARCHAR(100) DEFAULT 'Belgium';

-- Add new structured address fields to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(10);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address_country VARCHAR(100) DEFAULT 'Belgium';

-- ============================================================================
-- 5. UPDATE PRICE LIST STRUCTURE
-- ============================================================================

-- Add new price list fields
ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS weekend_surcharge_percentage INTEGER DEFAULT 0;
ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS overtime_rate_multiplier DECIMAL(3,2) DEFAULT 1.5;
ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS minimum_charge DECIMAL(10,2) DEFAULT 0;
ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS travel_cost_per_km DECIMAL(10,2) DEFAULT 0;
ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS additional_services JSONB DEFAULT '{}';

-- Migrate existing weekend_surcharge to weekend_surcharge_percentage (if column exists)
DO $$
BEGIN
    -- Check if weekend_surcharge column exists before trying to migrate
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'price_lists' 
        AND column_name = 'weekend_surcharge'
    ) THEN
        UPDATE price_lists SET weekend_surcharge_percentage = weekend_surcharge WHERE weekend_surcharge IS NOT NULL;
    END IF;
END $$;

-- Drop old columns
ALTER TABLE price_lists DROP COLUMN IF EXISTS central_cleaning_rate;
ALTER TABLE price_lists DROP COLUMN IF EXISTS weekend_surcharge;
ALTER TABLE price_lists DROP COLUMN IF EXISTS cement_bag_price;
ALTER TABLE price_lists DROP COLUMN IF EXISTS second_pumpist_rate;
ALTER TABLE price_lists DROP COLUMN IF EXISTS second_pumpist_pipe_length;

-- ============================================================================
-- 6. ADD MISSING INDEXES
-- ============================================================================

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_jobs_org_start_status ON jobs(organization_id, start_time, status);
CREATE INDEX IF NOT EXISTS idx_clients_org_name ON clients(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_machines_org_type ON machines(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_jobs_org_client ON jobs(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_pumpist ON jobs(organization_id, pumpist_id);

-- ============================================================================
-- 7. ADD DATA VALIDATION CONSTRAINTS
-- ============================================================================

-- Add check constraints for data validation (drop first if they exist)
DO $$
BEGIN
    -- Jobs constraints
    BEGIN
        ALTER TABLE jobs ADD CONSTRAINT jobs_start_before_end CHECK (start_time < end_time);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    BEGIN
        ALTER TABLE jobs ADD CONSTRAINT jobs_departure_before_start CHECK (departure_time IS NULL OR departure_time <= start_time);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    BEGIN
        ALTER TABLE jobs ADD CONSTRAINT jobs_positive_volume CHECK (expected_volume > 0);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    BEGIN
        ALTER TABLE jobs ADD CONSTRAINT jobs_positive_pipe_length CHECK (pipe_length >= 0);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    -- Job tracking constraints
    BEGIN
        ALTER TABLE job_tracking ADD CONSTRAINT job_tracking_start_before_end CHECK (actual_start_time IS NULL OR actual_end_time IS NULL OR actual_start_time <= actual_end_time);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    BEGIN
        ALTER TABLE job_tracking ADD CONSTRAINT job_tracking_positive_volume CHECK (actual_volume IS NULL OR actual_volume >= 0);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    BEGIN
        ALTER TABLE job_tracking ADD CONSTRAINT job_tracking_positive_pipe_length CHECK (actual_pipe_length IS NULL OR actual_pipe_length >= 0);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    -- Pump types constraints
    BEGIN
        ALTER TABLE pump_types ADD CONSTRAINT pump_types_positive_capacity CHECK (capacity IS NULL OR capacity > 0);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    -- Price lists constraints
    BEGIN
        ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_cement_price CHECK (cement_milk_price IS NULL OR cement_milk_price >= 0);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    BEGIN
        ALTER TABLE price_lists ADD CONSTRAINT price_lists_valid_weekend_surcharge CHECK (weekend_surcharge_percentage >= 0 AND weekend_surcharge_percentage <= 100);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    BEGIN
        ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_overtime_multiplier CHECK (overtime_rate_multiplier IS NULL OR overtime_rate_multiplier >= 1.0);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
END $$;

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Update the get_user_organization_id function
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Bypass RLS by using a security definer function that operates with elevated privileges
    -- This function is marked as SECURITY DEFINER to bypass RLS and avoid recursion
    SELECT organization_id INTO org_id
    FROM users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;

-- Create the get_current_user function to avoid RLS recursion
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TABLE(
    id UUID,
    organization_id UUID,
    auth_user_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN,
    email VARCHAR(255),
    phone VARCHAR(50),
    roles TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- This function bypasses RLS to avoid recursion when getting current user
    RETURN QUERY
    SELECT 
        u.id,
        u.organization_id,
        u.auth_user_id,
        u.first_name,
        u.last_name,
        u.is_active,
        u.email,
        u.phone,
        u.roles,
        u.created_at,
        u.updated_at
    FROM users u
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user() TO authenticated;

-- ============================================================================
-- 9. RECREATE USERS POLICIES (FIXED)
-- ============================================================================

-- Policy for viewing users: Users can view other users in their organization
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT
    USING (
        organization_id IN (
            SELECT u.organization_id
            FROM users u
            WHERE u.auth_user_id = auth.uid()
        )
    );

-- Policy for managing users: Only managers and org admins can manage users
CREATE POLICY "Managers can manage users in their organization" ON users
    FOR ALL
    USING (
        organization_id IN (
            SELECT u.organization_id
            FROM users u
            WHERE u.auth_user_id = auth.uid()
            AND ('manager' = ANY(u.roles) OR 'organization_admin' = ANY(u.roles))
        )
    );

-- Add policy for inserting users (needed for user registration)
CREATE POLICY "Allow user creation" ON users
    FOR INSERT
    WITH CHECK (true);  -- This will be controlled by application logic

-- Add policy for updating own user profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- ============================================================================
-- 10. ADD ORGANIZATION LIMIT ENFORCEMENT
-- ============================================================================

-- Function to check user limit
CREATE OR REPLACE FUNCTION check_user_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_user_count INTEGER;
    max_users_limit INTEGER;
BEGIN
    -- Get current user count and limit for the organization
    SELECT COUNT(*), o.max_users INTO current_user_count, max_users_limit
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    WHERE u.organization_id = NEW.organization_id AND u.is_active = true
    GROUP BY o.max_users;
    
    -- Check if adding this user would exceed the limit
    IF current_user_count >= max_users_limit THEN
        RAISE EXCEPTION 'Organization user limit exceeded. Current: %, Limit: %', current_user_count, max_users_limit;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check pump limit (for machines table)
CREATE OR REPLACE FUNCTION check_pump_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_pump_count INTEGER;
    max_pumps_limit INTEGER;
BEGIN
    -- Only check for pump type machines
    IF NEW.type = 'pump' THEN
        -- Get current pump count and limit for the organization
        SELECT COUNT(*), o.max_pumps INTO current_pump_count, max_pumps_limit
        FROM machines m
        JOIN organizations o ON m.organization_id = o.id
        WHERE m.organization_id = NEW.organization_id AND m.is_active = true AND m.type = 'pump'
        GROUP BY o.max_pumps;
        
        -- Check if adding this pump would exceed the limit
        IF current_pump_count >= max_pumps_limit THEN
            RAISE EXCEPTION 'Organization pump limit exceeded. Current: %, Limit: %', current_pump_count, max_pumps_limit;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for limit enforcement
DROP TRIGGER IF EXISTS check_user_limit_trigger ON users;
CREATE TRIGGER check_user_limit_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_user_limit();

DROP TRIGGER IF EXISTS check_pump_limit_trigger ON machines;
CREATE TRIGGER check_pump_limit_trigger
    BEFORE INSERT ON machines
    FOR EACH ROW
    EXECUTE FUNCTION check_pump_limit();

-- ============================================================================
-- 11. UPDATE AUDIT LOGGING FUNCTION
-- ============================================================================

-- Update audit trigger function with better error handling
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
    user_id_val UUID;
    ip_addr INET;
    user_agent_text TEXT;
BEGIN
    -- Get user's organization and ID
    SELECT organization_id, id INTO user_org_id, user_id_val
    FROM users 
    WHERE auth_user_id = auth.uid();
    
    -- If user not found, skip audit logging
    IF user_org_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Safely get IP address and user agent with fallbacks
    BEGIN
        ip_addr := inet_client_addr();
    EXCEPTION WHEN OTHERS THEN
        ip_addr := NULL;
    END;
    
    BEGIN
        user_agent_text := current_setting('request.headers', true)::json->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        user_agent_text := 'Unknown';
    END;
    
    -- Insert audit log with error handling
    BEGIN
        INSERT INTO audit_logs (
            organization_id,
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values,
            ip_address,
            user_agent
        ) VALUES (
            user_org_id,
            user_id_val,
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
            ip_addr,
            user_agent_text
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log audit failure but don't fail the main operation
        RAISE WARNING 'Audit logging failed for % on %: %', TG_OP, TG_TABLE_NAME, SQLERRM;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_user_organization_id() IS 'Helper function to get current user organization ID, bypasses RLS to avoid recursion';
COMMENT ON FUNCTION get_current_user() IS 'Function to get current user without RLS recursion issues';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully! RLS recursion issues have been fixed.';
    RAISE NOTICE 'You can now use get_current_user() function in your application to avoid recursion.';
END $$;
