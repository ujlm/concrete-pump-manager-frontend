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
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    email VARCHAR(255),
    phone VARCHAR(50),
    roles TEXT[] DEFAULT '{}', -- manager, organization_admin, accountant, dispatcher, driver
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
    name VARCHAR(100) NOT NULL, -- Pomp 32, Pomp 36
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
    name VARCHAR(100) NOT NULL, -- eg Particulier_2025
    is_active BOOLEAN DEFAULT true,
    cement_milk_price DECIMAL(10,2) DEFAULT 7.50,
    central_cleaning_rate DECIMAL(10,2) DEFAULT 0.00,
    weekend_surcharge_percentage INTEGER DEFAULT 50, -- Percentage
    cement_bag_price DECIMAL(10,2) DEFAULT 7.50,
    second_pumpist_rate DECIMAL(10,2) DEFAULT 70.00,
    threshold_concrete_hose_length_second_pumpist DECIMAL(10,2) DEFAULT 80, -- in meters, when concrete hose length is longer than this, second pumpist is charged
    overtime_rate_multiplier DECIMAL(3,2) DEFAULT 1,
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
    client_code VARCHAR(50) NOT NULL, -- can be different from id to match the client code in the existing administration of the client
    name VARCHAR(255) NOT NULL, -- eg Demo Construction Ltd
    price_list_id UUID REFERENCES price_lists(id),
    is_concrete_supplier BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    phone VARCHAR(50),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',
    company_number VARCHAR(50),
    vat_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, client_code)
);

-- ============================================================================
-- 6. CONCRETE PLANTS TABLE ("betoncentrale" in Dutch)
-- ============================================================================

CREATE TABLE concrete_plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50), -- can be different from id to match the client code in the existing administration of the client
    name VARCHAR(255) NOT NULL, -- eg DSV Aarschot
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- client linked to the concrete plant eg DSV Aarschot
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. YARDS TABLE ("werf" in Dutch)
-- ============================================================================

CREATE TABLE yards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- name of the yard
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contact_person VARCHAR(255), -- name or address of the contact person
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
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
    name VARCHAR(255) NOT NULL, -- eg Pomp 36 - Geert
    machine_code VARCHAR(50), -- P36-1
    pumpist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invoice_template_id UUID REFERENCES invoice_templates(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    license_plate VARCHAR(10), -- eg 1-ABC-123
    type VARCHAR(20) CHECK (type IN ('pump', 'mixer')),
    pump_type_id UUID REFERENCES pump_types(id) ON DELETE SET NULL, -- eg Pomp 36
    brand VARCHAR(50), -- eg Putzmeister
    pump_length INTEGER, -- eg 10.5 (in meters)
    pump_width INTEGER, -- eg 2.5 (in meters)
    pump_height INTEGER, -- eg 4 (in meters)
    vertical INTEGER, -- eg 32 (in meters)
    horizontal INTEGER, -- eg 28 (in meters)
    pump_weight INTEGER, -- eg 30 (in ton)
    pump_rhythm INTEGER, -- eg 150 (in l/min)
    pump_pressure INTEGER, -- eg 85 (in bar)
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

    -- planning/job status
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,

    planning_status VARCHAR(30) DEFAULT 'planned' CHECK (planning_status IN ('planned', 'assigned')), -- determines if the job is planned or assigned ("definitief toegewezen")
    job_status VARCHAR(30) DEFAULT 'planning' CHECK (job_status IN ('planning', 'received', 'in_progress', 'completed', 'invoiced', 'cancelled')),
    proprietary_concrete BOOLEAN DEFAULT false, -- if proprietary concrete, indicate this with different color in the calendar
    color VARCHAR(50), -- allow user to set custom colors: green, orange, red, ...
    
    -- client
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE RESTRICT, -- by default set to the client's price list

    -- yard
    yard_id UUID REFERENCES yards(id) ON DELETE SET NULL,
    travel_time_minutes INTEGER NOT NULL, -- Waze estimated travel time in minutes from organization's office to the job's location

    -- supplier
    concrete_plant_id UUID REFERENCES concrete_plants(id) ON DELETE SET NULL,

    -- driver
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- machine
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,

    -- job details
    pump_type_requested_id UUID REFERENCES pump_types(id) ON DELETE SET NULL,
    pump_type_id UUID REFERENCES pump_types(id) ON DELETE SET NULL,

    volume_expected INTEGER NOT NULL, --in m3

    -- pipe
    pipe_expected INTEGER NOT NULL DEFAULT 35, --in ml

    -- options
    cement_milk BOOLEAN DEFAULT false,
    central_cleaning BOOLEAN DEFAULT false,
    cement_bags INTEGER DEFAULT 0,
    frc BOOLEAN DEFAULT false, -- fiber reinforced concrete

    -- address information (for jobs that don't reference a specific yard)
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_country VARCHAR(100) DEFAULT 'Belgium',

    -- varia
    order_number VARCHAR(50),
    dispatcher_notes TEXT,
    pumpist_notes TEXT,
    
    -- metadata
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
    actual_volume INTEGER, --in m3
    actual_pipe INTEGER, --in ml

    job_progress VARCHAR(30) DEFAULT 'idle' CHECK (job_progress IN ('idle', 'underway', 'on_site', 'safety_check', 'start_installation', 'end_installation', 'start_pumping', 'end_pumping', 'fill_in_form', 'sign_form', 'leave_site')),

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
-- 14. INVOICES TABLE
-- ============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, invoice_number)
);

-- ============================================================================
-- 15. INVOICE LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
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
CREATE INDEX idx_invoice_templates_organization_id ON invoice_templates(organization_id);
CREATE INDEX idx_machines_organization_id ON machines(organization_id);
CREATE INDEX idx_jobs_organization_id ON jobs(organization_id);
CREATE INDEX idx_job_tracking_organization_id ON job_tracking(organization_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);

-- Job-related indexes
CREATE INDEX idx_jobs_start_time ON jobs(start_time);
CREATE INDEX idx_jobs_planning_status ON jobs(planning_status);
CREATE INDEX idx_jobs_job_status ON jobs(job_status);
CREATE INDEX idx_jobs_driver_id ON jobs(driver_id);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_job_tracking_job_id ON job_tracking(job_id);
CREATE INDEX idx_job_tracking_job_progress ON job_tracking(job_progress);

-- User and authentication indexes
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_roles ON users USING GIN(roles);

-- Audit log indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Foreign key indexes for JOIN performance
CREATE INDEX idx_jobs_yard_id ON jobs(yard_id);
CREATE INDEX idx_jobs_concrete_plant_id ON jobs(concrete_plant_id);
CREATE INDEX idx_jobs_machine_id ON jobs(machine_id);
CREATE INDEX idx_jobs_pump_type_requested_id ON jobs(pump_type_requested_id);
CREATE INDEX idx_jobs_pump_type_id ON jobs(pump_type_id);
CREATE INDEX idx_jobs_price_list_id ON jobs(price_list_id);
CREATE INDEX idx_machines_pumpist_id ON machines(pumpist_id);
CREATE INDEX idx_machines_invoice_template_id ON machines(invoice_template_id);
CREATE INDEX idx_machines_pump_type_id ON machines(pump_type_id);
CREATE INDEX idx_clients_price_list_id ON clients(price_list_id);
CREATE INDEX idx_concrete_plants_client_id ON concrete_plants(client_id);
CREATE INDEX idx_yards_client_id ON yards(client_id);

-- Time-based query indexes
CREATE INDEX idx_jobs_start_time_end_time ON jobs(start_time, end_time);
CREATE INDEX idx_job_tracking_actual_start_time ON job_tracking(actual_start_time);
CREATE INDEX idx_job_tracking_actual_end_time ON job_tracking(actual_end_time);

-- Additional performance indexes
CREATE INDEX idx_jobs_org_start_status ON jobs(organization_id, start_time, job_status);
CREATE INDEX idx_jobs_org_planning_status ON jobs(organization_id, planning_status);
CREATE INDEX idx_jobs_org_job_status ON jobs(organization_id, job_status);
CREATE INDEX idx_jobs_org_driver_status ON jobs(organization_id, driver_id, job_status);
CREATE INDEX idx_jobs_org_start_end ON jobs(organization_id, start_time, end_time);
CREATE INDEX idx_jobs_client_status ON jobs(client_id, job_status);
CREATE INDEX idx_clients_org_name ON clients(organization_id, name);
CREATE INDEX idx_machines_org_type ON machines(organization_id, type);
CREATE INDEX idx_jobs_org_client ON jobs(organization_id, client_id);
CREATE INDEX idx_jobs_org_driver ON jobs(organization_id, driver_id);

-- Address-based indexes for jobs
CREATE INDEX idx_jobs_address_city ON jobs(address_city);
CREATE INDEX idx_jobs_address_postal_code ON jobs(address_postal_code);

-- Partial indexes for better performance on filtered data
CREATE INDEX idx_jobs_active ON jobs(organization_id, start_time) WHERE job_status != 'cancelled';
CREATE INDEX idx_machines_active ON machines(organization_id, name) WHERE is_active = true;
CREATE INDEX idx_clients_active ON clients(organization_id, name) WHERE is_active = true;

-- ============================================================================
-- 15. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- todo: add RLS policies after RLS is enabled

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
CREATE TRIGGER audit_invoice_templates AFTER INSERT OR UPDATE OR DELETE ON invoice_templates FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_machines AFTER INSERT OR UPDATE OR DELETE ON machines FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_jobs AFTER INSERT OR UPDATE OR DELETE ON jobs FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_job_tracking AFTER INSERT OR UPDATE OR DELETE ON job_tracking FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- 18. UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM users 
        WHERE auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- see sample_data.sql for sample data

-- ============================================================================
-- 20. ADDITIONAL CONSTRAINTS AND VALIDATIONS
-- ============================================================================

-- Add check constraints for data validation
ALTER TABLE jobs ADD CONSTRAINT jobs_start_before_end CHECK (start_time < end_time);
ALTER TABLE jobs ADD CONSTRAINT jobs_positive_volume CHECK (volume_expected > 0);
ALTER TABLE jobs ADD CONSTRAINT jobs_positive_pipe_length CHECK (pipe_expected >= 0);

ALTER TABLE job_tracking ADD CONSTRAINT job_tracking_start_before_end CHECK (actual_start_time IS NULL OR actual_end_time IS NULL OR actual_start_time <= actual_end_time);
ALTER TABLE job_tracking ADD CONSTRAINT job_tracking_positive_volume CHECK (actual_volume IS NULL OR actual_volume >= 0);
ALTER TABLE job_tracking ADD CONSTRAINT job_tracking_positive_pipe_length CHECK (actual_pipe IS NULL OR actual_pipe >= 0);

ALTER TABLE pump_types ADD CONSTRAINT pump_types_positive_capacity CHECK (capacity IS NULL OR capacity > 0);

-- Price list constraints
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_cement_milk_price CHECK (cement_milk_price IS NULL OR cement_milk_price >= 0);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_central_cleaning_rate CHECK (central_cleaning_rate IS NULL OR central_cleaning_rate >= 0);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_cement_bag_price CHECK (cement_bag_price IS NULL OR cement_bag_price >= 0);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_second_pumpist_rate CHECK (second_pumpist_rate IS NULL OR second_pumpist_rate >= 0);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_threshold_hose_length CHECK (threshold_concrete_hose_length_second_pumpist IS NULL OR threshold_concrete_hose_length_second_pumpist >= 0);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_minimum_charge CHECK (minimum_charge IS NULL OR minimum_charge >= 0);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_travel_cost CHECK (travel_cost_per_km IS NULL OR travel_cost_per_km >= 0);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_valid_weekend_surcharge CHECK (weekend_surcharge_percentage >= 0 AND weekend_surcharge_percentage <= 100);
ALTER TABLE price_lists ADD CONSTRAINT price_lists_positive_overtime_multiplier CHECK (overtime_rate_multiplier IS NULL OR overtime_rate_multiplier >= 1.0);

-- Machine constraints
ALTER TABLE machines ADD CONSTRAINT machines_positive_pump_length CHECK (pump_length IS NULL OR pump_length > 0);
ALTER TABLE machines ADD CONSTRAINT machines_positive_pump_width CHECK (pump_width IS NULL OR pump_width > 0);
ALTER TABLE machines ADD CONSTRAINT machines_positive_pump_height CHECK (pump_height IS NULL OR pump_height > 0);
ALTER TABLE machines ADD CONSTRAINT machines_positive_vertical CHECK (vertical IS NULL OR vertical > 0);
ALTER TABLE machines ADD CONSTRAINT machines_positive_horizontal CHECK (horizontal IS NULL OR horizontal > 0);
ALTER TABLE machines ADD CONSTRAINT machines_positive_pump_weight CHECK (pump_weight IS NULL OR pump_weight > 0);
ALTER TABLE machines ADD CONSTRAINT machines_positive_pump_rhythm CHECK (pump_rhythm IS NULL OR pump_rhythm > 0);
ALTER TABLE machines ADD CONSTRAINT machines_positive_pump_pressure CHECK (pump_pressure IS NULL OR pump_pressure > 0);

-- Job constraints
ALTER TABLE jobs ADD CONSTRAINT jobs_positive_cement_bags CHECK (cement_bags IS NULL OR cement_bags >= 0);
ALTER TABLE jobs ADD CONSTRAINT jobs_positive_travel_time CHECK (travel_time_minutes IS NULL OR travel_time_minutes >= 0);

-- Email validation constraints
ALTER TABLE organizations ADD CONSTRAINT organizations_valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE users ADD CONSTRAINT users_valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE yards ADD CONSTRAINT yards_valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

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
    
    -- Check if adding this user would exceed the limit (account for the new user being active)
    IF NEW.is_active = true AND current_user_count >= max_users_limit THEN
        RAISE EXCEPTION 'Organization user limit exceeded. Current: %, Limit: %', current_user_count, max_users_limit;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_user_limit_insert_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_user_limit();

CREATE TRIGGER check_user_limit_update_trigger
    BEFORE UPDATE ON users
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
        
        -- Check if adding this pump would exceed the limit (account for the new pump being active)
        IF NEW.is_active = true AND current_pump_count >= max_pumps_limit THEN
            RAISE EXCEPTION 'Organization pump limit exceeded. Current: %, Limit: %', current_pump_count, max_pumps_limit;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_pump_limit_insert_trigger
    BEFORE INSERT ON machines
    FOR EACH ROW
    EXECUTE FUNCTION check_pump_limit();

CREATE TRIGGER check_pump_limit_update_trigger
    BEFORE UPDATE ON machines
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
COMMENT ON TABLE invoice_templates IS 'Customizable invoice templates per organization';
COMMENT ON TABLE machines IS 'Pump and mixer machines with assigned pumpists';
COMMENT ON TABLE jobs IS 'Concrete pump jobs with scheduling and tracking';
COMMENT ON TABLE job_tracking IS 'Actual vs expected job performance tracking';
COMMENT ON TABLE audit_logs IS 'Complete audit trail for all data changes';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

