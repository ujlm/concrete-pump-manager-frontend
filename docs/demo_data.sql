-- Demo Data Script for Concrete Pump Management System
-- Organization ID: ef0c92f7-abcb-4946-b1c9-abbbb01ddcea
-- User ID: b86d524d-f367-4c5a-b464-7cc2a73846dd

-- Set the organization and user IDs as variables for easy reference
DO $$
DECLARE
    org_id UUID := 'ef0c92f7-abcb-4946-b1c9-abbbb01ddcea';
    user_id UUID := 'b86d524d-f367-4c5a-b464-7cc2a73846dd';
    pump_type_25_id UUID;
    pump_type_32_id UUID;
    pump_type_36_id UUID;
    standard_price_list_id UUID;
    premium_price_list_id UUID;
    client_1_id UUID;
    client_2_id UUID;
    client_3_id UUID;
    supplier_1_id UUID;
    concrete_plant_1_id UUID;
    yard_1_id UUID;
    yard_2_id UUID;
    machine_1_id UUID;
    machine_2_id UUID;
    job_1_id UUID;
    job_2_id UUID;
    job_3_id UUID;
BEGIN
    -- ============================================================================
    -- 1. UPDATE USER WITH PROPER ROLES
    -- ============================================================================
    
    UPDATE users 
    SET 
        first_name = 'John',
        last_name = 'Manager',
        email = 'john.manager@demopump.com',
        phone = '+32 123 456 789',
        roles = ARRAY['organization_admin', 'manager', 'dispatcher'],
        is_active = true,
        updated_at = NOW()
    WHERE id = user_id AND organization_id = org_id;

    -- ============================================================================
    -- 2. CREATE PUMP TYPES
    -- ============================================================================
    
    -- Insert pump types one by one to get their IDs (with conflict handling)
    INSERT INTO pump_types (id, organization_id, name, capacity, is_active) VALUES
    (uuid_generate_v4(), org_id, 'Pump 25m³', 25, true)
    ON CONFLICT (organization_id, name) DO UPDATE SET
        capacity = EXCLUDED.capacity,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO pump_type_25_id;

    INSERT INTO pump_types (id, organization_id, name, capacity, is_active) VALUES
    (uuid_generate_v4(), org_id, 'Pump 32m³', 32, true)
    ON CONFLICT (organization_id, name) DO UPDATE SET
        capacity = EXCLUDED.capacity,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO pump_type_32_id;

    INSERT INTO pump_types (id, organization_id, name, capacity, is_active) VALUES
    (uuid_generate_v4(), org_id, 'Pump 36m³', 36, true)
    ON CONFLICT (organization_id, name) DO UPDATE SET
        capacity = EXCLUDED.capacity,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO pump_type_36_id;

    -- ============================================================================
    -- 3. CREATE PRICE LISTS
    -- ============================================================================
    
    -- Insert price lists one by one to get their IDs (with conflict handling)
    INSERT INTO price_lists (id, organization_id, name, is_active, cement_milk_price, weekend_surcharge_percentage, overtime_rate_multiplier, minimum_charge, travel_cost_per_km, additional_services) VALUES
    (uuid_generate_v4(), org_id, 'Standard Pricing', true, 45.00, 50, 1.5, 100.00, 2.50, '{"crane_rental": 150.00, "cleaning_service": 25.00, "standby_hourly_rate": 75.00}')
    ON CONFLICT (organization_id, name) DO UPDATE SET
        cement_milk_price = EXCLUDED.cement_milk_price,
        weekend_surcharge_percentage = EXCLUDED.weekend_surcharge_percentage,
        overtime_rate_multiplier = EXCLUDED.overtime_rate_multiplier,
        minimum_charge = EXCLUDED.minimum_charge,
        travel_cost_per_km = EXCLUDED.travel_cost_per_km,
        additional_services = EXCLUDED.additional_services,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO standard_price_list_id;

    INSERT INTO price_lists (id, organization_id, name, is_active, cement_milk_price, weekend_surcharge_percentage, overtime_rate_multiplier, minimum_charge, travel_cost_per_km, additional_services) VALUES
    (uuid_generate_v4(), org_id, 'Premium Pricing', true, 55.00, 60, 1.8, 150.00, 3.00, '{"crane_rental": 200.00, "cleaning_service": 35.00, "standby_hourly_rate": 100.00}')
    ON CONFLICT (organization_id, name) DO UPDATE SET
        cement_milk_price = EXCLUDED.cement_milk_price,
        weekend_surcharge_percentage = EXCLUDED.weekend_surcharge_percentage,
        overtime_rate_multiplier = EXCLUDED.overtime_rate_multiplier,
        minimum_charge = EXCLUDED.minimum_charge,
        travel_cost_per_km = EXCLUDED.travel_cost_per_km,
        additional_services = EXCLUDED.additional_services,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO premium_price_list_id;

    -- ============================================================================
    -- 4. CREATE CLIENTS
    -- ============================================================================
    
    -- Insert clients one by one to get their IDs (with conflict handling)
    INSERT INTO clients (id, organization_id, client_code, name, price_list_id, is_concrete_supplier, phone, address_street, address_city, address_postal_code, address_country) VALUES
    (uuid_generate_v4(), org_id, 'CLI001', 'Demo Construction Ltd', standard_price_list_id, false, '+32 11 123 456', 'Industrieweg 15', 'Antwerpen', '2000', 'Belgium')
    ON CONFLICT (organization_id, client_code) DO UPDATE SET
        name = EXCLUDED.name,
        price_list_id = EXCLUDED.price_list_id,
        is_concrete_supplier = EXCLUDED.is_concrete_supplier,
        phone = EXCLUDED.phone,
        address_street = EXCLUDED.address_street,
        address_city = EXCLUDED.address_city,
        address_postal_code = EXCLUDED.address_postal_code,
        address_country = EXCLUDED.address_country,
        updated_at = NOW()
    RETURNING id INTO client_1_id;

    INSERT INTO clients (id, organization_id, client_code, name, price_list_id, is_concrete_supplier, phone, address_street, address_city, address_postal_code, address_country) VALUES
    (uuid_generate_v4(), org_id, 'CLI002', 'Belgian Builders NV', premium_price_list_id, false, '+32 9 987 654', 'Boulevardstraat 42', 'Gent', '9000', 'Belgium')
    ON CONFLICT (organization_id, client_code) DO UPDATE SET
        name = EXCLUDED.name,
        price_list_id = EXCLUDED.price_list_id,
        is_concrete_supplier = EXCLUDED.is_concrete_supplier,
        phone = EXCLUDED.phone,
        address_street = EXCLUDED.address_street,
        address_city = EXCLUDED.address_city,
        address_postal_code = EXCLUDED.address_postal_code,
        address_country = EXCLUDED.address_country,
        updated_at = NOW()
    RETURNING id INTO client_2_id;

    INSERT INTO clients (id, organization_id, client_code, name, price_list_id, is_concrete_supplier, phone, address_street, address_city, address_postal_code, address_country) VALUES
    (uuid_generate_v4(), org_id, 'CLI003', 'Concrete Solutions BV', standard_price_list_id, true, '+32 2 555 123', 'Havenlaan 8', 'Brussel', '1000', 'Belgium')
    ON CONFLICT (organization_id, client_code) DO UPDATE SET
        name = EXCLUDED.name,
        price_list_id = EXCLUDED.price_list_id,
        is_concrete_supplier = EXCLUDED.is_concrete_supplier,
        phone = EXCLUDED.phone,
        address_street = EXCLUDED.address_street,
        address_city = EXCLUDED.address_city,
        address_postal_code = EXCLUDED.address_postal_code,
        address_country = EXCLUDED.address_country,
        updated_at = NOW()
    RETURNING id INTO client_3_id;

    -- ============================================================================
    -- 5. CREATE SUPPLIERS
    -- ============================================================================
    
    INSERT INTO suppliers (id, organization_id, name, contact_person, phone, email, address_street, address_city, address_postal_code, address_country, is_active) VALUES
    (uuid_generate_v4(), org_id, 'Concrete Solutions BV', 'Jan Concrete', '+32 2 555 123', 'jan@concretesolutions.be', 'Havenlaan 8', 'Brussel', '1000', 'Belgium', true)
    RETURNING id INTO supplier_1_id;

    -- ============================================================================
    -- 6. CREATE CONCRETE PLANTS
    -- ============================================================================
    
    INSERT INTO concrete_plants (id, organization_id, name, client_id, address_street, address_city, address_postal_code, address_country) VALUES
    (uuid_generate_v4(), org_id, 'Plant Antwerpen', client_3_id, 'Havenlaan 8', 'Antwerpen', '2000', 'Belgium')
    RETURNING id INTO concrete_plant_1_id;

    -- ============================================================================
    -- 7. CREATE YARDS
    -- ============================================================================
    
    -- Insert yards one by one to get their IDs (with conflict handling)
    INSERT INTO yards (id, organization_id, name, client_id, contact_person, address_street, address_city, address_postal_code, address_country, phone, email) VALUES
    (uuid_generate_v4(), org_id, 'Yard Antwerpen Centrum', client_1_id, 'Peter Yard', 'Centrumstraat 25', 'Antwerpen', '2000', 'Belgium', '+32 11 123 457', 'peter@democonstruction.be')
    ON CONFLICT (organization_id, name) DO UPDATE SET
        client_id = EXCLUDED.client_id,
        contact_person = EXCLUDED.contact_person,
        address_street = EXCLUDED.address_street,
        address_city = EXCLUDED.address_city,
        address_postal_code = EXCLUDED.address_postal_code,
        address_country = EXCLUDED.address_country,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        updated_at = NOW()
    RETURNING id INTO yard_1_id;

    INSERT INTO yards (id, organization_id, name, client_id, contact_person, address_street, address_city, address_postal_code, address_country, phone, email) VALUES
    (uuid_generate_v4(), org_id, 'Yard Gent Noord', client_2_id, 'Lisa Yard', 'Noordstraat 88', 'Gent', '9000', 'Belgium', '+32 9 987 655', 'lisa@belgianbuilders.be')
    ON CONFLICT (organization_id, name) DO UPDATE SET
        client_id = EXCLUDED.client_id,
        contact_person = EXCLUDED.contact_person,
        address_street = EXCLUDED.address_street,
        address_city = EXCLUDED.address_city,
        address_postal_code = EXCLUDED.address_postal_code,
        address_country = EXCLUDED.address_country,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        updated_at = NOW()
    RETURNING id INTO yard_2_id;

    -- ============================================================================
    -- 8. CREATE MACHINES
    -- ============================================================================
    
    -- Insert machines one by one to get their IDs (with conflict handling)
    INSERT INTO machines (id, organization_id, name, machine_code, pumpist_id, is_active, license_plate, type, pump_type_id) VALUES
    (uuid_generate_v4(), org_id, 'Pump Truck 1', 'PT001', user_id, true, 'ABC-123', 'pump', pump_type_32_id)
    ON CONFLICT (organization_id, name) DO UPDATE SET
        machine_code = EXCLUDED.machine_code,
        pumpist_id = EXCLUDED.pumpist_id,
        is_active = EXCLUDED.is_active,
        license_plate = EXCLUDED.license_plate,
        type = EXCLUDED.type,
        pump_type_id = EXCLUDED.pump_type_id,
        updated_at = NOW()
    RETURNING id INTO machine_1_id;

    INSERT INTO machines (id, organization_id, name, machine_code, pumpist_id, is_active, license_plate, type, pump_type_id) VALUES
    (uuid_generate_v4(), org_id, 'Pump Truck 2', 'PT002', user_id, true, 'DEF-456', 'pump', pump_type_36_id)
    ON CONFLICT (organization_id, name) DO UPDATE SET
        machine_code = EXCLUDED.machine_code,
        pumpist_id = EXCLUDED.pumpist_id,
        is_active = EXCLUDED.is_active,
        license_plate = EXCLUDED.license_plate,
        type = EXCLUDED.type,
        pump_type_id = EXCLUDED.pump_type_id,
        updated_at = NOW()
    RETURNING id INTO machine_2_id;

    -- ============================================================================
    -- 9. CREATE JOBS
    -- ============================================================================
    
    -- Job 1: Planned for today
    INSERT INTO jobs (id, organization_id, departure_time, start_time, end_time, pump_type_id, pump_type_requested_id, pumpist_id, client_id, price_list_id, address_street, address_city, address_postal_code, address_country, yard, phone, concrete_supplier_id, concrete_plant_id, expected_volume, pipe_length, construction_type, dispatcher_notes, status) VALUES
    (uuid_generate_v4(), org_id, 
     NOW() + INTERVAL '1 hour', 
     NOW() + INTERVAL '2 hours', 
     NOW() + INTERVAL '6 hours', 
     pump_type_32_id, pump_type_32_id, user_id, client_1_id, standard_price_list_id, 
     'Centrumstraat 25', 'Antwerpen', '2000', 'Belgium', 'Yard Antwerpen Centrum', '+32 11 123 457', 
     supplier_1_id, concrete_plant_1_id, 15, 25, 'Foundation', 'Standard foundation pour', 'gepland')
    RETURNING id INTO job_1_id;

    -- Job 2: Planned for tomorrow
    INSERT INTO jobs (id, organization_id, departure_time, start_time, end_time, pump_type_id, pump_type_requested_id, pumpist_id, client_id, price_list_id, address_street, address_city, address_postal_code, address_country, yard, phone, concrete_supplier_id, concrete_plant_id, expected_volume, pipe_length, construction_type, dispatcher_notes, status) VALUES
    (uuid_generate_v4(), org_id, 
     NOW() + INTERVAL '25 hours', 
     NOW() + INTERVAL '26 hours', 
     NOW() + INTERVAL '30 hours', 
     pump_type_36_id, pump_type_36_id, user_id, client_2_id, premium_price_list_id, 
     'Noordstraat 88', 'Gent', '9000', 'Belgium', 'Yard Gent Noord', '+32 9 987 655', 
     supplier_1_id, concrete_plant_1_id, 20, 30, 'Slab', 'Premium slab pour with special requirements', 'gepland')
    RETURNING id INTO job_2_id;

    -- Job 3: To be planned
    INSERT INTO jobs (id, organization_id, departure_time, start_time, end_time, pump_type_id, pump_type_requested_id, pumpist_id, client_id, price_list_id, address_street, address_city, address_postal_code, address_country, yard, phone, concrete_supplier_id, concrete_plant_id, expected_volume, pipe_length, construction_type, dispatcher_notes, status) VALUES
    (uuid_generate_v4(), org_id, 
     NULL, 
     NOW() + INTERVAL '3 days', 
     NOW() + INTERVAL '3 days 4 hours', 
     pump_type_25_id, pump_type_25_id, user_id, client_3_id, standard_price_list_id, 
     'Havenlaan 8', 'Brussel', '1000', 'Belgium', 'Yard Brussel', '+32 2 555 124', 
     supplier_1_id, concrete_plant_1_id, 12, 20, 'Wall', 'Standard wall pour - needs scheduling', 'te_plannen')
    RETURNING id INTO job_3_id;

    -- ============================================================================
    -- 10. CREATE JOB TRACKING RECORDS
    -- ============================================================================
    
    -- Add tracking for completed job (if any)
    INSERT INTO job_tracking (id, job_id, organization_id, actual_start_time, actual_end_time, actual_volume, actual_pipe_length, notes, tracked_by) VALUES
    (uuid_generate_v4(), job_1_id, org_id, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes', 15, 25, 'Job completed successfully, no issues', user_id);

    -- ============================================================================
    -- 11. CREATE ADDITIONAL USERS FOR DEMO
    -- ============================================================================
    
    -- Create a dispatcher user
    INSERT INTO users (id, organization_id, auth_user_id, first_name, last_name, is_active, email, phone, roles) VALUES
    (uuid_generate_v4(), org_id, uuid_generate_v4(), 'Sarah', 'Dispatcher', true, 'sarah.dispatcher@demopump.com', '+32 11 234 567', ARRAY['dispatcher']);

    -- Create a pumpist user
    INSERT INTO users (id, organization_id, auth_user_id, first_name, last_name, is_active, email, phone, roles) VALUES
    (uuid_generate_v4(), org_id, uuid_generate_v4(), 'Mike', 'Pumpist', true, 'mike.pumpist@demopump.com', '+32 11 345 678', ARRAY['pompist']);

    -- Create an accountant user
    INSERT INTO users (id, organization_id, auth_user_id, first_name, last_name, is_active, email, phone, roles) VALUES
    (uuid_generate_v4(), org_id, uuid_generate_v4(), 'Anna', 'Accountant', true, 'anna.accountant@demopump.com', '+32 11 456 789', ARRAY['accountant']);

    RAISE NOTICE 'Demo data created successfully!';
    RAISE NOTICE 'Organization ID: %', org_id;
    RAISE NOTICE 'User ID: %', user_id;
    RAISE NOTICE 'Created % pump types, % price lists, % clients, % jobs', 
        (SELECT COUNT(*) FROM pump_types WHERE organization_id = org_id),
        (SELECT COUNT(*) FROM price_lists WHERE organization_id = org_id),
        (SELECT COUNT(*) FROM clients WHERE organization_id = org_id),
        (SELECT COUNT(*) FROM jobs WHERE organization_id = org_id);

END $$;
