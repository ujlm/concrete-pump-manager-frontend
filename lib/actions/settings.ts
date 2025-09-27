'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/dashboard';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  OrganizationFormData,
  UserFormData,
  UserInviteFormData,
  UserAddFormData,
  PumpTypeFormData,
  PriceListFormData,
  ClientFormData,
  MachineFormData,
  InvoiceTemplateFormData
} from '@/lib/validations/settings';

// Helper function to check user permissions
async function checkPermissions(requiredRoles: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  if (!user.roles.some(role => requiredRoles.includes(role))) {
    throw new Error('Insufficient permissions');
  }

  return user;
}

// Organization Settings Actions
export async function updateOrganization(organizationSlug: string, data: OrganizationFormData) {
  const user = await checkPermissions(['manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('organizations')
      .update({
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        address_street: data.address_street,
        address_city: data.address_city,
        address_postal_code: data.address_postal_code,
        address_country: data.address_country,
        phone: data.phone,
        email: data.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/organization`);
    return { success: true, message: 'Organization updated successfully' };
  } catch (error) {
    console.error('Error updating organization:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update organization' };
  }
}

// User Management Actions
export async function createUser(organizationSlug: string, data: UserInviteFormData | UserAddFormData) {
  const user = await checkPermissions(['manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    // Check if this is an invitation (has email) or direct user creation
    const isInvitation = 'email' in data && data.email && data.email.trim() !== '';
    
    // For users without email (drivers), we don't create auth accounts
    // For users with email (invitations), auth_user_id will be set later when they accept the invitation
    const { error } = await supabase
      .from('users')
      .insert({
        organization_id: user.organization_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: isInvitation ? data.email : null,
        phone: 'phone' in data ? data.phone : null,
        roles: data.roles,
        is_active: true,
        auth_user_id: null, // Will be set later for invited users when they accept
      });

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/users`);
    return { 
      success: true, 
      message: isInvitation ? 'User invited successfully' : 'User added successfully' 
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create user' };
  }
}

export async function updateUser(organizationSlug: string, userId: string, data: UserFormData) {
  const user = await checkPermissions(['manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('users')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email && data.email.trim() !== '' ? data.email : null,
        phone: data.phone,
        roles: data.roles,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/users`);
    return { success: true, message: 'User updated successfully' };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update user' };
  }
}

export async function deleteUser(organizationSlug: string, userId: string) {
  const user = await checkPermissions(['manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/users`);
    return { success: true, message: 'User deactivated successfully' };
  } catch (error) {
    console.error('Error deactivating user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to deactivate user' };
  }
}

// Pump Type Actions
export async function createPumpType(organizationSlug: string, data: PumpTypeFormData) {
  const user = await checkPermissions(['dispatcher', 'manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('pump_types')
      .insert({
        organization_id: user.organization_id,
        name: data.name,
        capacity: data.capacity,
        is_active: data.is_active,
      });

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/pump-types`);
    return { success: true, message: 'Pump type created successfully' };
  } catch (error) {
    console.error('Error creating pump type:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create pump type' };
  }
}

export async function updatePumpType(organizationSlug: string, pumpTypeId: string, data: PumpTypeFormData) {
  const user = await checkPermissions(['dispatcher', 'manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('pump_types')
      .update({
        name: data.name,
        capacity: data.capacity,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pumpTypeId)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/pump-types`);
    return { success: true, message: 'Pump type updated successfully' };
  } catch (error) {
    console.error('Error updating pump type:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update pump type' };
  }
}

export async function deletePumpType(organizationSlug: string, pumpTypeId: string) {
  const user = await checkPermissions(['dispatcher', 'manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('pump_types')
      .delete()
      .eq('id', pumpTypeId)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/pump-types`);
    return { success: true, message: 'Pump type deleted successfully' };
  } catch (error) {
    console.error('Error deleting pump type:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete pump type' };
  }
}

// Get organization data for settings
export async function getOrganizationForSettings(organizationSlug: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', organizationSlug)
      .eq('id', user.organization_id)
      .single();

    if (error) throw error;
    return organization;
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}

// Get users for user management
export async function getOrganizationUsers(organizationSlug: string) {
  const user = await checkPermissions(['manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    // Query users with application-level security filtering
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Additional security check at application level
    const filteredUsers = users?.filter(u => u.organization_id === user.organization_id) || [];
    
    return filteredUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Get pump types
export async function getOrganizationPumpTypes(organizationSlug: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  try {
    const { data: pumpTypes, error } = await supabase
      .from('pump_types')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return pumpTypes;
  } catch (error) {
    console.error('Error fetching pump types:', error);
    return [];
  }
}

// Price List Actions
export async function createPriceList(organizationSlug: string, data: PriceListFormData) {
  const user = await checkPermissions(['manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('price_lists')
      .insert({
        organization_id: user.organization_id,
        name: data.name,
        description: data.description,
        base_price_per_hour: data.base_price_per_hour,
        base_price_per_cubic_meter: data.base_price_per_cubic_meter,
        minimum_hours: data.minimum_hours,
        travel_cost_per_km: data.travel_cost_per_km,
        setup_fee: data.setup_fee,
        overtime_multiplier: data.overtime_multiplier,
        weekend_multiplier: data.weekend_multiplier,
        holiday_multiplier: data.holiday_multiplier,
        is_default: data.is_default,
        is_active: data.is_active,
      });

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/price-lists`);
    return { success: true, message: 'Price list created successfully' };
  } catch (error) {
    console.error('Error creating price list:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create price list' };
  }
}

export async function updatePriceList(organizationSlug: string, priceListId: string, data: PriceListFormData) {
  const user = await checkPermissions(['manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('price_lists')
      .update({
        name: data.name,
        description: data.description,
        base_price_per_hour: data.base_price_per_hour,
        base_price_per_cubic_meter: data.base_price_per_cubic_meter,
        minimum_hours: data.minimum_hours,
        travel_cost_per_km: data.travel_cost_per_km,
        setup_fee: data.setup_fee,
        overtime_multiplier: data.overtime_multiplier,
        weekend_multiplier: data.weekend_multiplier,
        holiday_multiplier: data.holiday_multiplier,
        is_default: data.is_default,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', priceListId)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/price-lists`);
    return { success: true, message: 'Price list updated successfully' };
  } catch (error) {
    console.error('Error updating price list:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update price list' };
  }
}

export async function deletePriceList(organizationSlug: string, priceListId: string) {
  const user = await checkPermissions(['manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('price_lists')
      .delete()
      .eq('id', priceListId)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/price-lists`);
    return { success: true, message: 'Price list deleted successfully' };
  } catch (error) {
    console.error('Error deleting price list:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete price list' };
  }
}

// Get price lists
export async function getOrganizationPriceLists(organizationSlug: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  try {
    const { data: priceLists, error } = await supabase
      .from('price_lists')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return priceLists;
  } catch (error) {
    console.error('Error fetching price lists:', error);
    return [];
  }
}

// Client Actions
export async function createClientRecord(organizationSlug: string, data: ClientFormData) {
  const user = await checkPermissions(['dispatcher', 'manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('clients')
      .insert({
        organization_id: user.organization_id,
        name: data.name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        address_street: data.address_street,
        address_city: data.address_city,
        address_postal_code: data.address_postal_code,
        address_country: data.address_country,
        vat_number: data.vat_number,
        payment_terms: data.payment_terms,
        credit_limit: data.credit_limit,
        notes: data.notes,
        is_active: data.is_active,
      });

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/clients`);
    return { success: true, message: 'Client created successfully' };
  } catch (error) {
    console.error('Error creating client:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create client' };
  }
}

export async function updateClient(organizationSlug: string, clientId: string, data: ClientFormData) {
  const user = await checkPermissions(['dispatcher', 'manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('clients')
      .update({
        name: data.name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        address_street: data.address_street,
        address_city: data.address_city,
        address_postal_code: data.address_postal_code,
        address_country: data.address_country,
        vat_number: data.vat_number,
        payment_terms: data.payment_terms,
        credit_limit: data.credit_limit,
        notes: data.notes,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/clients`);
    return { success: true, message: 'Client updated successfully' };
  } catch (error) {
    console.error('Error updating client:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update client' };
  }
}

export async function deleteClient(organizationSlug: string, clientId: string) {
  const user = await checkPermissions(['manager', 'organization_admin']);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', clientId)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/settings/clients`);
    return { success: true, message: 'Client deactivated successfully' };
  } catch (error) {
    console.error('Error deactivating client:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to deactivate client' };
  }
}

// Get clients
export async function getOrganizationClients(organizationSlug: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return clients;
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
}