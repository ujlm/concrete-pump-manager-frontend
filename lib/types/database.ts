export type UserRole =
  | 'manager'
  | 'organization_admin'
  | 'accountant'
  | 'dispatcher'
  | 'driver';

export type JobStatus =
  | 'planning'
  | 'received'
  | 'in_progress'
  | 'completed'
  | 'invoiced'
  | 'cancelled';

export type PlanningStatus =
  | 'planned'
  | 'assigned';

export type JobProgress =
  | 'idle'
  | 'underway'
  | 'on_site'
  | 'safety_check'
  | 'start_installation'
  | 'end_installation'
  | 'start_pumping'
  | 'end_pumping'
  | 'fill_in_form'
  | 'sign_form'
  | 'leave_site';

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  subscription_active: boolean;
  max_users: number;
  max_pumps: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  auth_user_id?: string; // Optional for users who don't have auth accounts (e.g., drivers)
  first_name: string;
  last_name: string;
  is_active: boolean;
  email?: string; // Optional for users who won't use the software
  phone?: string;
  roles: UserRole[];
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface PumpType {
  id: string;
  organization_id: string;
  name: string;
  capacity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceList {
  id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
  cement_milk_price: number;
  central_cleaning_rate: number;
  weekend_surcharge_percentage: number;
  cement_bag_price: number;
  second_pumpist_rate: number;
  threshold_concrete_hose_length_second_pumpist: number;
  overtime_rate_multiplier: number;
  minimum_charge: number;
  travel_cost_per_km: number;
  additional_services: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  client_code: string;
  name: string;
  price_list_id?: string;
  is_concrete_supplier: boolean;
  is_active: boolean;
  phone?: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  company_number?: string;
  vat_number?: string;
  created_at: string;
  updated_at: string;
  price_list?: PriceList;
}

export interface ConcretePlant {
  id: string;
  organization_id: string;
  code?: string;
  name: string;
  client_id?: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Yard {
  id: string;
  organization_id: string;
  name: string;
  client_id?: string;
  contact_person?: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface InvoiceTemplate {
  id: string;
  organization_id: string;
  name: string;
  template_data: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: string;
  organization_id: string;
  name: string;
  machine_code?: string;
  pumpist_id?: string;
  invoice_template_id?: string;
  is_active: boolean;
  license_plate?: string;
  type: 'pump' | 'mixer';
  pump_type_id?: string;
  brand?: string;
  pump_length?: number;
  pump_width?: number;
  pump_height?: number;
  vertical?: number;
  horizontal?: number;
  pump_weight?: number;
  pump_rhythm?: number;
  pump_pressure?: number;
  created_at: string;
  updated_at: string;
  pumpist?: User;
  pump_type?: PumpType;
  invoice_template?: InvoiceTemplate;
}

export interface Job {
  id: string;
  organization_id: string;
  start_time: string;
  end_time: string;
  planning_status: PlanningStatus;
  job_status: JobStatus;
  proprietary_concrete: boolean;
  color?: string;
  client_id: string;
  price_list_id: string;
  yard_id?: string;
  travel_time_minutes: number;
  concrete_plant_id?: string;
  driver_id?: string;
  machine_id?: string;
  pump_type_requested_id?: string;
  pump_type_id?: string;
  volume_expected: number;
  pipe_expected: number;
  cement_milk: boolean;
  central_cleaning: boolean;
  cement_bags: number;
  frc: boolean;
  order_number?: string;
  dispatcher_notes?: string;
  pumpist_notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  yard?: Yard;
  concrete_plant?: ConcretePlant;
  driver?: User;
  machine?: Machine;
  pump_type_requested?: PumpType;
  pump_type?: PumpType;
  price_list?: PriceList;
}

export interface JobTracking {
  id: string;
  job_id: string;
  organization_id: string;
  actual_start_time?: string;
  actual_end_time?: string;
  actual_volume?: number;
  actual_pipe?: number;
  job_progress: JobProgress;
  notes?: string;
  tracked_by?: string;
  created_at: string;
  updated_at: string;
  job?: Job;
  tracked_by_user?: User;
}

export interface Invoice {
  id: string;
  organization_id: string;
  job_id?: string;
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  job?: Job;
  client?: Client;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}

// Dashboard specific types
export interface DashboardStats {
  todaysJobs: {
    total: number;
    planned: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  activePumps: number;
  upcomingJobs: Job[];
  performanceMetrics: {
    jobCompletionRate: number;
    averageEfficiency: number;
    onTimeDeliveryRate: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface DateRange {
  from: Date;
  to: Date;
}