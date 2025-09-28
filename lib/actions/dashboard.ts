'use server';

import { createClient } from '@/lib/supabase/server';
import {
  DashboardStats,
  User,
  ChartData,
  DateRange
} from '@/lib/types/database';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return null;

    // Use the special function to get current user without RLS recursion
    const { data: userData, error } = await supabase
      .rpc('get_current_user');

    if (error) {
      console.error('Error fetching current user:', error);
      return null;
    }

    const user = userData?.[0];
    if (!user) {
      console.error('No user found for authenticated user');
      return null;
    }

    // Get organization slug using the existing RPC function
    const { data: organizationSlug, error: slugError } = await supabase
      .rpc('get_organization_slug');

    console.log('User organization_id:', user.organization_id);
    console.log('Organization slug via RPC:', organizationSlug);
    console.log('Slug error:', slugError);

    let organization = null;
    
    // If we got the slug, fetch the full organization data using RPC function that bypasses RLS
    if (organizationSlug && !slugError) {
      const { data: orgData, error: orgError } = await supabase
        .rpc('get_organization_by_slug', { org_slug: organizationSlug });
      
      // console.log('Organization data via RPC:', orgData);
      console.log('Organization error:', orgError);
      organization = orgData?.[0];
    }

    // Fallback: if RPC function doesn't exist, try direct query
    if (!organization) {
      console.log('Falling back to direct query...');
      const { data: directOrgData, error: directOrgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user.organization_id)
        .single();
      
      console.log('Organization data via direct query:', directOrgData);
      console.log('Direct query error:', directOrgError);
      organization = directOrgData;
    }

    return {
      ...user,
      organization: organization || undefined
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createClient();
  const today = new Date();

  try {
    // Get user's organization context
    const user = await getCurrentUser();
    if (!user) return null;

    // Today's jobs summary
    const { data: todaysJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('status')
      .eq('organization_id', user.organization_id)
      .gte('start_time', startOfDay(today).toISOString())
      .lte('start_time', endOfDay(today).toISOString());

    if (jobsError) throw jobsError;

    const jobStats = {
      total: todaysJobs?.length || 0,
      planned: todaysJobs?.filter(j => j.job_status === 'planning' || j.job_status === 'received').length || 0,
      completed: todaysJobs?.filter(j => j.job_status === 'completed').length || 0,
      cancelled: todaysJobs?.filter(j => j.job_status === 'cancelled').length || 0,
    };

    // Revenue data (this would need to be calculated from job pricing)
    const revenueStats = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };

    // Active pumps count
    const { data: activePumps, error: pumpsError } = await supabase
      .from('machines')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('type', 'pump')
      .eq('is_active', true);

    if (pumpsError) throw pumpsError;

    // Upcoming jobs (next 5)
    const { data: upcomingJobs, error: upcomingError } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients(*),
        yard:yards(*),
        concrete_plant:concrete_plants(*),
        driver:users!jobs_driver_id_fkey(*)
      `)
      .eq('organization_id', user.organization_id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(5);

    if (upcomingError) throw upcomingError;

    // Performance metrics (mock data for now)
    const performanceMetrics = {
      jobCompletionRate: 85.2,
      averageEfficiency: 92.7,
      onTimeDeliveryRate: 88.5,
    };

    return {
      todaysJobs: jobStats,
      revenue: revenueStats,
      activePumps: activePumps?.length || 0,
      upcomingJobs: upcomingJobs || [],
      performanceMetrics,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}

export async function getRevenueChartData(dateRange: DateRange): Promise<ChartData | null> {
  // This would fetch actual revenue data from jobs/invoices
  // For now, returning mock data
  const labels = [];
  const data = [];

  // Generate labels for the date range
  const current = new Date(dateRange.from);
  while (current <= dateRange.to) {
    labels.push(format(current, 'MMM dd'));
    data.push(Math.floor(Math.random() * 5000) + 2000); // Mock revenue data
    current.setDate(current.getDate() + 1);
  }

  return {
    labels,
    datasets: [{
      label: 'Daily Revenue (€)',
      data,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
    }]
  };
}

export async function getJobDistributionChartData(): Promise<ChartData | null> {
  const supabase = await createClient();

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('status')
      .eq('organization_id', user.organization_id)
      .gte('start_time', startOfMonth(new Date()).toISOString())
      .lte('start_time', endOfMonth(new Date()).toISOString());

    if (error) throw error;

    const statusCounts = jobs?.reduce((acc: Record<string, number>, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const statusLabels: Record<string, string> = {
      'to_plan': 'To Plan',
      'planned': 'Planned',
      'planned_own_concrete': 'Planned (Own Concrete)',
      'en_route': 'En Route',
      'arrived': 'Arrived',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };

    return {
      labels: Object.keys(statusCounts).map(status => statusLabels[status] || status),
      datasets: [{
        label: 'Jobs by Status',
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
      }]
    };
  } catch (error) {
    console.error('Error fetching job distribution data:', error);
    return null;
  }
}

export async function getVolumeChartData(dateRange: DateRange): Promise<ChartData | null> {
  const supabase = await createClient();

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('start_time, expected_volume')
      .eq('organization_id', user.organization_id)
      .gte('start_time', dateRange.from.toISOString())
      .lte('start_time', dateRange.to.toISOString())
      .not('expected_volume', 'is', null)
      .order('start_time');

    if (error) throw error;

    // Group by week or month depending on date range
    const volumeByPeriod: Record<string, number> = {};

    jobs?.forEach(job => {
      const date = new Date(job.start_time);
      const period = format(date, 'MMM dd');
        volumeByPeriod[period] = (volumeByPeriod[period] || 0) + (job.expected_volume || 0);
    });

    return {
      labels: Object.keys(volumeByPeriod),
      datasets: [{
        label: 'Volume Pumped (m³)',
        data: Object.values(volumeByPeriod),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      }]
    };
  } catch (error) {
    console.error('Error fetching volume chart data:', error);
    return null;
  }
}

export async function getUsersByRole() {
  const supabase = await createClient();

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_active', true);

    if (error) throw error;

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return null;
  }
}

export async function hasRole(requiredRoles: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  return user.roles.some(role => requiredRoles.includes(role));
}