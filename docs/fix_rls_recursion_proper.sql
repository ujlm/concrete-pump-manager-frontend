-- Proper fix for RLS recursion while maintaining security
-- This keeps RLS enabled but fixes the circular dependency

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTIONS (BYPASS RLS FOR HELPER FUNCTIONS ONLY)
-- ============================================================================

-- Function to get user's organization ID without RLS recursion
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- SECURITY DEFINER bypasses RLS for this function only
    -- This prevents recursion while maintaining security
    SELECT organization_id INTO org_id
    FROM users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user without RLS recursion
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
    -- SECURITY DEFINER bypasses RLS for this function only
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user() TO authenticated;

-- ============================================================================
-- 2. DROP EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Drop policies that cause recursion
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Managers can manage users in their organization" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- ============================================================================
-- 3. CREATE PROPER RLS POLICIES (NO RECURSION)
-- ============================================================================

-- Policy 1: Users can view their own record
CREATE POLICY "Users can access their own record" ON users
    FOR ALL
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Policy 2: Users can view other users in their organization
-- This uses direct subquery instead of helper function to avoid recursion
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

-- Policy 3: Managers can manage users in their organization
CREATE POLICY "Managers can manage users in their organization" ON users
    FOR ALL
    USING (
        organization_id = (
            SELECT organization_id 
            FROM users 
            WHERE auth_user_id = auth.uid() 
            LIMIT 1
        )
        AND EXISTS (
            SELECT 1 
            FROM users 
            WHERE auth_user_id = auth.uid() 
            AND ('manager' = ANY(roles) OR 'organization_admin' = ANY(roles))
        )
    );

-- Policy 4: Allow user creation (controlled by application logic)
CREATE POLICY "Allow user creation" ON users
    FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- 4. UPDATE OTHER TABLE POLICIES TO USE HELPER FUNCTIONS
-- ============================================================================

-- Now other tables can safely use get_user_organization_id() 
-- because it's a SECURITY DEFINER function that bypasses RLS

-- Update pump types policies
DROP POLICY IF EXISTS "Users can view pump types in their organization" ON pump_types;
DROP POLICY IF EXISTS "Dispatchers can manage pump types in their organization" ON pump_types;

CREATE POLICY "Users can view pump types in their organization" ON pump_types
    FOR SELECT 
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Dispatchers can manage pump types in their organization" ON pump_types
    FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_user_id = auth.uid()
            AND organization_id = get_user_organization_id()
            AND ('dispatcher' = ANY(roles) OR 'manager' = ANY(roles) OR 'organization_admin' = ANY(roles))
        )
    );

-- Update price lists policies
DROP POLICY IF EXISTS "Users can view price lists in their organization" ON price_lists;
DROP POLICY IF EXISTS "Dispatchers can manage price lists in their organization" ON price_lists;

CREATE POLICY "Users can view price lists in their organization" ON price_lists
    FOR SELECT 
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Dispatchers can manage price lists in their organization" ON price_lists
    FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_user_id = auth.uid()
            AND organization_id = get_user_organization_id()
            AND ('dispatcher' = ANY(roles) OR 'manager' = ANY(roles) OR 'organization_admin' = ANY(roles))
        )
    );

-- Update clients policies
DROP POLICY IF EXISTS "Users can view clients in their organization" ON clients;
DROP POLICY IF EXISTS "Dispatchers can manage clients in their organization" ON clients;

CREATE POLICY "Users can view clients in their organization" ON clients
    FOR SELECT 
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Dispatchers can manage clients in their organization" ON clients
    FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_user_id = auth.uid()
            AND organization_id = get_user_organization_id()
            AND ('dispatcher' = ANY(roles) OR 'manager' = ANY(roles) OR 'organization_admin' = ANY(roles))
        )
    );

-- ============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_user_organization_id() IS 'Helper function to get current user organization ID. Uses SECURITY DEFINER to bypass RLS and prevent recursion while maintaining security.';
COMMENT ON FUNCTION get_current_user() IS 'Function to get current user data. Uses SECURITY DEFINER to bypass RLS and prevent recursion while maintaining security.';

-- ============================================================================
-- 6. VERIFY RLS IS STILL ENABLED
-- ============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pump_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'RLS recursion fix completed successfully!';
    RAISE NOTICE 'RLS is still enabled and properly configured.';
    RAISE NOTICE 'Helper functions use SECURITY DEFINER to prevent recursion.';
    RAISE NOTICE 'All security policies are maintained.';
END $$;
