import { z } from 'zod';

// Organization Settings Schema
export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name must be less than 255 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  domain: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color').default('#3B82F6'),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color').default('#1E40AF'),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_country: z.string().default('Belgium'),
  phone: z.string().optional(),
  email: z.string().email('Must be a valid email address').optional(),
});

// User Management Schema
export const userSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name must be less than 100 characters'),
  email: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  roles: z.array(z.enum(['driver', 'dispatcher', 'accountant', 'manager', 'organization_admin']))
    .min(1, 'At least one role must be selected'),
  is_active: z.boolean().default(true),
});

export const userFormSchema = userSchema;

export const userInviteSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name must be less than 100 characters'),
  roles: z.array(z.enum(['driver', 'dispatcher', 'accountant', 'manager', 'organization_admin']))
    .min(1, 'At least one role must be selected'),
});

export const userAddSchema = z.object({
  email: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name must be less than 100 characters'),
  phone: z.string().optional(),
  roles: z.array(z.enum(['driver', 'dispatcher', 'accountant', 'manager', 'organization_admin']))
    .min(1, 'At least one role must be selected'),
});

// Pump Type Schema
export const pumpTypeSchema = z.object({
  name: z.string().min(1, 'Pump type name is required').max(100, 'Name must be less than 100 characters'),
  capacity: z.number().min(1, 'Capacity must be greater than 0').optional(),
  is_active: z.boolean().default(true),
});

// Price List Schema
export const priceListSchema = z.object({
  name: z.string().min(1, 'Price list name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  base_price_per_hour: z.number().min(0, 'Price cannot be negative'),
  base_price_per_cubic_meter: z.number().min(0, 'Price cannot be negative'),
  minimum_hours: z.number().min(0, 'Minimum hours cannot be negative').default(2),
  travel_cost_per_km: z.number().min(0, 'Travel cost cannot be negative').default(2.5),
  setup_fee: z.number().min(0, 'Setup fee cannot be negative').default(150),
  overtime_multiplier: z.number().min(1, 'Multiplier must be at least 1.0').default(1.5),
  weekend_multiplier: z.number().min(1, 'Multiplier must be at least 1.0').default(1.25),
  holiday_multiplier: z.number().min(1, 'Multiplier must be at least 1.0').default(2.0),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

// Client Schema
export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255, 'Name must be less than 255 characters'),
  contact_person: z.string().optional(),
  email: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_country: z.string().default('Belgium'),
  vat_number: z.string().optional(),
  payment_terms: z.number().min(0, 'Payment terms cannot be negative').optional(),
  credit_limit: z.number().min(0, 'Credit limit cannot be negative').optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Machine Schema
export const machineSchema = z.object({
  name: z.string().min(1, 'Machine name is required').max(255, 'Name must be less than 255 characters'),
  machine_code: z.string().max(50, 'Code must be less than 50 characters').optional(),
  pumpist_id: z.string().optional(),
  license_plate: z.string().max(10, 'License plate must be less than 10 characters').optional(),
  type: z.enum(['pump', 'mixer']),
  pump_type_id: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Invoice Template Schema
export const invoiceTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Name must be less than 100 characters'),
  template_data: z.record(z.any()).default({}),
  is_default: z.boolean().default(false),
});

// Export types
export type OrganizationFormData = z.infer<typeof organizationSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type UserInviteFormData = z.infer<typeof userInviteSchema>;
export type UserAddFormData = z.infer<typeof userAddSchema>;
export type PumpTypeFormData = z.infer<typeof pumpTypeSchema>;
export type PriceListFormData = z.infer<typeof priceListSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type MachineFormData = z.infer<typeof machineSchema>;
export type InvoiceTemplateFormData = z.infer<typeof invoiceTemplateSchema>;