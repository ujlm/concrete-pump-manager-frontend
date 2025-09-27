-- Fix RLS recursion for organizations table
-- Create a function that gets organization data bypassing RLS

CREATE OR REPLACE FUNCTION get_organization_by_slug(org_slug TEXT)
RETURNS TABLE(
    id UUID,
    name VARCHAR(255),
    slug VARCHAR(100),
    domain VARCHAR(255),
    logo_url TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN,
    subscription_active BOOLEAN,
    max_users INTEGER,
    max_pumps INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- This function bypasses RLS by using SECURITY DEFINER
    -- It only returns organization data if the current user belongs to that organization
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.domain,
        o.logo_url,
        o.primary_color,
        o.secondary_color,
        o.address_street,
        o.address_city,
        o.address_postal_code,
        o.address_country,
        o.phone,
        o.email,
        o.is_active,
        o.subscription_active,
        o.max_users,
        o.max_pumps,
        o.created_at,
        o.updated_at
    FROM organizations o
    INNER JOIN users u ON o.id = u.organization_id
    WHERE o.slug = org_slug
    AND u.auth_user_id = auth.uid()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_organization_by_slug(TEXT) TO authenticated;
