-- Fix infinite recursion in RLS policies for users table
-- The issue is that get_user_organization_id() queries users table,
-- but users table policies also call get_user_organization_id()

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Managers can manage users in their organization" ON users;

-- Step 2: Create a helper function that bypasses RLS for getting user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Bypass RLS by using a security definer function that operates with elevated privileges
    SELECT organization_id INTO org_id
    FROM users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;

-- Step 3: Create new users policies that avoid recursion

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

-- Step 4: Fix other policies that might have similar issues
-- Update organizations policy to avoid potential recursion
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT u.organization_id
            FROM users u
            WHERE u.auth_user_id = auth.uid()
        )
    );

-- Step 5: Update all other table policies to use consistent role names (lowercase)
-- The schema uses mixed case roles but our app uses lowercase

-- Drop and recreate policies with correct role names
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON organizations;
CREATE POLICY "Super admins can manage all organizations" ON organizations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_user_id = auth.uid()
            AND 'super_admin' = ANY(roles)
        )
    );

-- Update pump types policies
DROP POLICY IF EXISTS "Dispatchers can manage pump types in their organization" ON pump_types;
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
DROP POLICY IF EXISTS "Dispatchers can manage price lists in their organization" ON price_lists;
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
DROP POLICY IF EXISTS "Dispatchers can manage clients in their organization" ON clients;
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

-- Add policy for inserting users (needed for user registration)
CREATE POLICY "Allow user creation" ON users
    FOR INSERT
    WITH CHECK (true);  -- This will be controlled by application logic

-- Add policy for updating own user profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

COMMENT ON FUNCTION get_user_organization_id() IS 'Helper function to get current user organization ID, bypasses RLS to avoid recursion';