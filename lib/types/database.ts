export type UserRole =
  | 'super_admin'
  | 'organization_admin'
  | 'manager'
  | 'dispatcher'
  | 'accountant'
  | 'pompist';

export type JobStatus =
  | 'to_plan'
  | 'planned'
  | 'planned_own_concrete'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  contact_info: {
    email: string;
    phone: string;
    website?: string;
  };
  subscription_tier: SubscriptionTier;
  subscription_limits: {
    max_users?: number;
    max_jobs_per_month?: number;
    max_storage_gb?: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  auth_user_id?: string; // Optional for users who don't have auth accounts (e.g., drivers)
  first_name: string;
  last_name: string;
  email?: string; // Optional for users who won't use the software
  roles: UserRole[];
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface PumpType {
  id: string;
  organization_id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceList {
  id: string;
  organization_id: string;
  cement_milk_price: number;
  weekend_surcharge_percentage: number;
  overtime_rate_multiplier: number;
  minimum_charge: number;
  travel_cost_per_km: number;
  additional_services: {
    crane_rental?: number;
    cleaning_service?: number;
    standby_hourly_rate?: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  client_code: string;
  name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  price_list_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  price_list?: PriceList;
}

export interface ConcretePlant {
  id: string;
  organization_id: string;
  name: string;
  client_id: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  contact_info: {
    email?: string;
    phone?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Yard {
  id: string;
  organization_id: string;
  name: string;
  client_id: string;
  contact_person?: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  contact_info: {
    email?: string;
    phone?: string;
    contact_person?: string;
  };
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: string;
  organization_id: string;
  name: string;
  pompist_id?: string;
  license_plate?: string;
  type: 'pump' | 'mixer';
  pump_type_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pompist?: User;
  pump_type?: PumpType;
}

export interface Job {
  id: string;
  organization_id: string;
  departure_time: string;
  start_time?: string;
  end_time?: string;
  pump_type_ids: string[];
  client_id: string;
  yard_id?: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  contact_person: string;
  phone: string;
  volume_m3?: number;
  concrete_plant_id?: string;
  supplier_id?: string;
  notes?: string;
  status: JobStatus;
  created_by: string;
  assigned_pompist_id?: string;
  estimated_duration_hours?: number;
  price_quote?: number;
  created_at: string;
  updated_at: string;
  client?: Client;
  yard?: Yard;
  concrete_plant?: ConcretePlant;
  supplier?: Supplier;
  assigned_pompist?: User;
  created_by_user?: User;
  pump_types?: PumpType[];
}

export interface JobTracking {
  id: string;
  job_id: string;
  actual_start_time?: string;
  actual_end_time?: string;
  actual_volume_m3?: number;
  pipe_length_m?: number;
  concrete_quality?: string;
  weather_conditions?: string;
  performance_notes?: string;
  efficiency_rating?: number;
  created_at: string;
  updated_at: string;
  job?: Job;
}

export interface InvoiceTemplate {
  id: string;
  organization_id: string;
  name: string;
  template_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  organization_id?: string;
  action: string;
  table_name: string;
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