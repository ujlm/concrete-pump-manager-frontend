-- Concrete Pump Management System - Supabase Database Schema
-- This file sets up the complete database schema with multi-tenant organization support

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    subscription_active BOOLEAN DEFAULT true,
    max_users INTEGER DEFAULT 10,
    max_pumps INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    email VARCHAR(255),
    phone VARCHAR(50),
    roles TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(auth_user_id, organization_id)
);

-- ============================================================================
-- 3. PUMP TYPES TABLE
-- ============================================================================

CREATE TABLE pump_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER, -- m³/hour
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- ============================================================================
-- 4. PRICE LISTS TABLE
-- ============================================================================

CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cement_milk_price DECIMAL(10,2),
    weekend_surcharge_percentage INTEGER DEFAULT 0, -- Percentage
    overtime_rate_multiplier DECIMAL(3,2) DEFAULT 1.5,
    minimum_charge DECIMAL(10,2) DEFAULT 0,
    travel_cost_per_km DECIMAL(10,2) DEFAULT 0,
    additional_services JSONB DEFAULT '{}', -- Store crane_rental, cleaning_service, standby_hourly_rate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- ============================================================================
-- 5. CLIENTS TABLE
-- ============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_list_id UUID REFERENCES price_lists(id),
    is_concrete_supplier BOOLEAN DEFAULT false,
    phone VARCHAR(50),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, client_code)
);

-- ============================================================================
-- 6. CONCRETE PLANTS TABLE
-- ============================================================================

CREATE TABLE concrete_plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. YARDS TABLE
-- ============================================================================

CREATE TABLE yards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contact_person VARCHAR(255),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- ============================================================================
-- 8. SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 9. INVOICE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    template_data JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 10. MACHINES TABLE
-- ============================================================================

CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    machine_code VARCHAR(50),
    pumpist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invoice_template_id UUID REFERENCES invoice_templates(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    license_plate VARCHAR(10),
    type VARCHAR(20) CHECK (type IN ('pump', 'mixer')),
    pump_type_id UUID REFERENCES pump_types(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- ============================================================================
-- 11. JOBS TABLE
-- ============================================================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    departure_time TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pump_type_id UUID REFERENCES pump_types(id) ON DELETE SET NULL,
    pump_type_requested_id UUID REFERENCES pump_types(id) ON DELETE SET NULL,
    pumpist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE RESTRICT,
    address_street VARCHAR(255) NOT NULL,
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',
    yard VARCHAR(255),
    phone VARCHAR(50),
    concrete_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    concrete_plant_id UUID REFERENCES concrete_plants(id) ON DELETE SET NULL,
    expected_volume INTEGER NOT NULL,
    pipe_length INTEGER NOT NULL,
    construction_type VARCHAR(50) NOT NULL,
    dispatcher_notes TEXT,
    pumpist_notes TEXT,
    status VARCHAR(30) DEFAULT 'te_plannen' CHECK (status IN ('te_plannen', 'gepland', 'gepland_eigen_beton', 'geannuleerd')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 12. JOB TRACKING TABLE
-- ============================================================================

CREATE TABLE job_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    actual_volume INTEGER,
    actual_pipe_length INTEGER,
    notes TEXT,
    tracked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 13. AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 14. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organization-based indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_pump_types_organization_id ON pump_types(organization_id);
CREATE INDEX idx_price_lists_organization_id ON price_lists(organization_id);
CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_concrete_plants_organization_id ON concrete_plants(organization_id);
CREATE INDEX idx_yards_organization_id ON yards(organization_id);
CREATE INDEX idx_suppliers_organization_id ON suppliers(organization_id);
CREATE INDEX idx_invoice_templates_organization_id ON invoice_templates(organization_id);
CREATE INDEX idx_machines_organization_id ON machines(organization_id);
CREATE INDEX idx_jobs_organization_id ON jobs(organization_id);
CREATE INDEX idx_job_tracking_organization_id ON job_tracking(organization_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);

-- Job-related indexes
CREATE INDEX idx_jobs_start_time ON jobs(start_time);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_pumpist_id ON jobs(pumpist_id);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_job_tracking_job_id ON job_tracking(job_id);

-- User and authentication indexes
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_roles ON users USING GIN(roles);

-- Audit log indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Additional performance indexes
CREATE INDEX idx_jobs_org_start_status ON jobs(organization_id, start_time, status);
CREATE INDEX idx_clients_org_name ON clients(organization_id, name);
CREATE INDEX idx_machines_org_type ON machines(organization_id, type);
CREATE INDEX idx_jobs_org_client ON jobs(organization_id, client_id);
CREATE INDEX idx_jobs_org_pumpist ON jobs(organization_id, pumpist_id);

-- ============================================================================
-- 15. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pump_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE concrete_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE yards ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization (with recursion protection)
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

-- Special function to get current user without RLS recursion
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

-- Organizations policies
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT u.organization_id
            FROM users u
            WHERE u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can manage all organizations" ON organizations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_user_id = auth.uid()
            AND 'super_admin' = ANY(roles)
        )
    );

-- Users policies (fixed to avoid recursion)
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

-- Pump types policies
CREATE POLICY "Users can view pump types in their organization" ON pump_types
    FOR SELECT USING (organization_id = get_user_organization_id());

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

-- Price lists policies
CREATE POLICY "Users can view price lists in their organization" ON price_lists
    FOR SELECT USING (organization_id = get_user_organization_id());

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

-- Clients policies
CREATE POLICY "Users can view clients in their organization" ON clients
    FOR SELECT USING (organization_id = get_user_organization_id());

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

-- Concrete plants policies
CREATE POLICY "Users can view concrete plants in their organization" ON concrete_plants
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Dispatchers can manage concrete plants in their organization" ON concrete_plants
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

-- Yards policies
CREATE POLICY "Users can view yards in their organization" ON yards
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Dispatchers can manage yards in their organization" ON yards
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

-- Suppliers policies
CREATE POLICY "Users can view suppliers in their organization" ON suppliers
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Dispatchers can manage suppliers in their organization" ON suppliers
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

-- Invoice templates policies
CREATE POLICY "Users can view invoice templates in their organization" ON invoice_templates
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage invoice templates in their organization" ON invoice_templates
    FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_user_id = auth.uid()
            AND organization_id = get_user_organization_id()
            AND ('manager' = ANY(roles) OR 'organization_admin' = ANY(roles))
        )
    );

-- Machines policies
CREATE POLICY "Users can view machines in their organization" ON machines
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Dispatchers can manage machines in their organization" ON machines
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

-- Jobs policies
CREATE POLICY "Users can view jobs in their organization" ON jobs
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Pumpists can view their own jobs" ON jobs
    FOR SELECT USING (
        organization_id = get_user_organization_id() AND
        pumpist_id = (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Dispatchers can manage jobs in their organization" ON jobs
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

-- Job tracking policies
CREATE POLICY "Users can view job tracking in their organization" ON job_tracking
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Pumpists can update their own job tracking" ON job_tracking
    FOR ALL USING (
        organization_id = get_user_organization_id() AND
        tracked_by = (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Dispatchers can manage job tracking in their organization" ON job_tracking
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

-- Audit logs policies
CREATE POLICY "Users can view audit logs in their organization" ON audit_logs
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can view all audit logs in their organization" ON audit_logs
    FOR SELECT
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_user_id = auth.uid()
            AND organization_id = get_user_organization_id()
            AND ('manager' = ANY(roles) OR 'organization_admin' = ANY(roles))
        )
    );

-- ============================================================================
-- 16. TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pump_types_updated_at BEFORE UPDATE ON pump_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_price_lists_updated_at BEFORE UPDATE ON price_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concrete_plants_updated_at BEFORE UPDATE ON concrete_plants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_yards_updated_at BEFORE UPDATE ON yards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_templates_updated_at BEFORE UPDATE ON invoice_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_tracking_updated_at BEFORE UPDATE ON job_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 17. AUDIT LOGGING TRIGGERS
-- ============================================================================

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

-- Apply audit triggers to all tables (except audit_logs itself)
CREATE TRIGGER audit_organizations AFTER INSERT OR UPDATE OR DELETE ON organizations FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_pump_types AFTER INSERT OR UPDATE OR DELETE ON pump_types FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_price_lists AFTER INSERT OR UPDATE OR DELETE ON price_lists FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_concrete_plants AFTER INSERT OR UPDATE OR DELETE ON concrete_plants FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_yards AFTER INSERT OR UPDATE OR DELETE ON yards FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_suppliers AFTER INSERT OR UPDATE OR DELETE ON suppliers FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_invoice_templates AFTER INSERT OR UPDATE OR DELETE ON invoice_templates FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_machines AFTER INSERT OR UPDATE OR DELETE ON machines FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_jobs AFTER INSERT OR UPDATE OR DELETE ON jobs FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_job_tracking AFTER INSERT OR UPDATE OR DELETE ON job_tracking FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- 18. UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's roles
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS TEXT[] AS $$
BEGIN
    RETURN (
        SELECT roles 
        FROM users 
        WHERE auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN role_name = ANY(get_user_roles());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization slug
CREATE OR REPLACE FUNCTION get_organization_slug()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT slug 
        FROM organizations 
        WHERE id = get_user_organization_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 19. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Insert a sample organization
INSERT INTO organizations (name, slug, subscription_active, max_users, max_pumps) 
VALUES ('Demo Concrete Pump Co', 'demo-concrete-pump', true, 50, 20);

-- Get the organization ID for sample data
DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM organizations WHERE slug = 'demo-concrete-pump';
    
    -- Insert sample pump types
    INSERT INTO pump_types (organization_id, name, capacity) VALUES
    (org_id, 'Pump_leiden', 25),
    (org_id, 'Pump_32', 32),
    (org_id, 'Pump_36', 36);
    
    -- Insert sample price list
    INSERT INTO price_lists (organization_id, name, cement_milk_price, weekend_surcharge_percentage, overtime_rate_multiplier, minimum_charge, travel_cost_per_km, additional_services) VALUES
    (org_id, 'Standard Pricing', 45.00, 50, 1.5, 100.00, 2.50, '{"crane_rental": 150.00, "cleaning_service": 25.00, "standby_hourly_rate": 75.00}');
    
    -- Insert sample client
    INSERT INTO clients (organization_id, client_code, name, price_list_id) VALUES
    (org_id, '1001', 'Demo Construction Ltd', (SELECT id FROM price_lists WHERE organization_id = org_id LIMIT 1));
    
END $$;

-- ============================================================================
-- 20. ADDITIONAL CONSTRAINTS AND VALIDATIONS
-- ============================================================================

-- Add check constraints for data validation
ALTER TABLE jobs ADD CONSTRAINT jobs_start_before_end CHECK (start_time < end_time);
ALTER TABLE jobs ADD CONSTRAINT jobs_departure_before_start CHECK (departure_time IS NULL OR departure_time <= start_time);
ALTER TABLE jobs ADD CONSTRAINT jobs_positive_volume CHECK (expected_volume > 0);
ALTER TABLE jobs ADD CONSTRAINT jobs_positive_pipe_length CHECK (pipe_length >= 0);

ALTER TABLE job_tracking ADD CONSTRAINT job_tracking_start_before_end CHECK (actual_start_time IS NULL OR actual_end_time IS NULL OR actual_start_time <= actual_end_time);
ALTER TABLE job_tracking ADD CONSTRAINT job_tracking_positive_volume CHECK (actual_volume IS NULL OR actual_volume >= 0);
ALTER TABLE job_tracking ADD CONSTRAINT job_tracking_positive_pipe_length CHECK (actual_pipe_length IS NULL OR actual_pipe_length >= 0);

ALTER TABLE pump_types ADD CONSTRAINT pump_types_positive_capacity CHECK (capacity IS NULL OR capacity > 0);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_cement_price CHECK (cement_milk_price IS NULL OR cement_milk_price >= 0);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_valid_weekend_surcharge CHECK (weekend_surcharge_percentage >= 0 AND weekend_surcharge_percentage <= 100);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_overtime_multiplier CHECK (overtime_rate_multiplier IS NULL OR overtime_rate_multiplier >= 1.0);

-- Add organization subscription limit enforcement functions
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

CREATE TRIGGER check_user_limit_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_user_limit();

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

CREATE TRIGGER check_pump_limit_trigger
    BEFORE INSERT ON machines
    FOR EACH ROW
    EXECUTE FUNCTION check_pump_limit();

-- ============================================================================
-- 21. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_user_organization_id() IS 'Helper function to get current user organization ID, bypasses RLS to avoid recursion';

COMMENT ON TABLE organizations IS 'Multi-tenant organizations with subscription tiers and limits';
COMMENT ON TABLE users IS 'Users linked to organizations with role-based access control';
COMMENT ON TABLE pump_types IS 'Available pump types per organization with capacity specifications';
COMMENT ON TABLE price_lists IS 'Pricing configurations per organization';
COMMENT ON TABLE clients IS 'Client companies with custom pricing options';
COMMENT ON TABLE concrete_plants IS 'Concrete production plants linked to clients';
COMMENT ON TABLE yards IS 'Construction yards with contact information';
COMMENT ON TABLE suppliers IS 'Concrete suppliers and other service providers';
COMMENT ON TABLE invoice_templates IS 'Customizable invoice templates per organization';
COMMENT ON TABLE machines IS 'Pump and mixer machines with assigned pumpists';
COMMENT ON TABLE jobs IS 'Concrete pump jobs with scheduling and tracking';
COMMENT ON TABLE job_tracking IS 'Actual vs expected job performance tracking';
COMMENT ON TABLE audit_logs IS 'Complete audit trail for all data changes';

COMMENT ON FUNCTION get_user_organization_id() IS 'Helper function to get current user organization ID, bypasses RLS to avoid recursion';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

