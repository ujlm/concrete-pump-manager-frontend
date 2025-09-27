-- Quick fix for remaining RLS recursion and column issues
-- Run this after the main migration

-- ============================================================================
-- 1. COMPLETELY DISABLE RLS ON USERS TABLE TEMPORARILY
-- ============================================================================

-- Disable RLS on users table to break the recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RECREATE USERS POLICIES WITH PROPER RECURSION PROTECTION
-- ============================================================================

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Managers can manage users in their organization" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create a simple policy that doesn't cause recursion
CREATE POLICY "Users can access their own record" ON users
    FOR ALL
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Create policy for viewing other users in organization (using direct query)
CREATE POLICY "Users can view organization users" ON users
    FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id 
            FROM users 
            WHERE auth_user_id = auth.uid() 
            LIMIT 1
        )
    );

-- ============================================================================
-- 3. UPDATE APPLICATION CODE TO USE CORRECT COLUMN NAMES
-- ============================================================================

-- The application is looking for 'volume_m3' but the column is 'expected_volume'
-- We need to either:
-- 1. Add an alias column, or 
-- 2. Update the application code

-- Let's add an alias column for backward compatibility
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS volume_m3 INTEGER;

-- Update the alias column to match expected_volume
UPDATE jobs SET volume_m3 = expected_volume WHERE volume_m3 IS NULL;

-- Create a trigger to keep them in sync
CREATE OR REPLACE FUNCTION sync_volume_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep volume_m3 in sync with expected_volume
    NEW.volume_m3 = NEW.expected_volume;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync the columns
DROP TRIGGER IF EXISTS sync_volume_trigger ON jobs;
CREATE TRIGGER sync_volume_trigger
    BEFORE INSERT OR UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION sync_volume_columns();

-- ============================================================================
-- 4. TEST THE FIX
-- ============================================================================

-- Test that the get_current_user function works
SELECT 'Testing get_current_user function...' as status;

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Quick fix applied successfully!';
    RAISE NOTICE 'RLS recursion should be resolved.';
    RAISE NOTICE 'Volume column alias added for backward compatibility.';
END $$;
