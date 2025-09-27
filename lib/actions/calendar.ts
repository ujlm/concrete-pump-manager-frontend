'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/dashboard';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Job, Driver, JobStatus } from '@/lib/types/calendar';

// Helper function to check user permissions
async function checkCalendarPermissions() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  if (!user.roles.some(role => ['dispatcher', 'manager', 'organization_admin'].includes(role))) {
    throw new Error('Insufficient permissions to access calendar');
  }

  return user;
}

// Get jobs for a specific date and organization
export async function getJobsForDate(organizationSlug: string, date: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients(*),
        pumpist:users!jobs_pumpist_id_fkey(*),
        pump_type:pump_types!jobs_pump_type_id_fkey(*)
      `)
      .eq('organization_id', user.organization_id)
      .gte('start_time', `${date}T00:00:00`)
      .lt('start_time', `${date}T23:59:59`)
      .order('departure_time', { ascending: true, nullsFirst: false });

    if (error) throw error;

    // Transform the data to match our Job interface
    const transformedJobs = jobs?.map(job => ({
      ...job,
      // Convert timestamps to time strings for the frontend
      departure_time: job.departure_time ? new Date(job.departure_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      start_time: job.start_time ? new Date(job.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      end_time: job.end_time ? new Date(job.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      // Map database fields to expected interface fields
      volume_m3: job.expected_volume,
      travel_time_minutes: null, // Not in schema yet
      notes: job.dispatcher_notes || '',
      is_concrete_supplier_job: false, // Not in schema yet
    })) || [];

    return transformedJobs as Job[];
  } catch (error) {
    console.error('Error fetching jobs for date:', error);
    return [];
  }
}

// Get all active drivers for organization
export async function getActiveDrivers(organizationSlug: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  try {
    const { data: drivers, error } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', user.organization_id)
      .contains('roles', ['pompist'])
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    if (error) throw error;

    return drivers as Driver[];
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
}

// Create a new job
export async function createJob(organizationSlug: string, jobData: Partial<Job>) {
  const user = await checkCalendarPermissions();
  const supabase = await createClient();

  try {
    // Transform frontend data to database schema
    const dbJobData = {
      organization_id: user.organization_id,
      client_id: jobData.client_id,
      pumpist_id: jobData.pumpist_id,
      pump_type_id: jobData.pump_type_id,
      status: jobData.status || 'to_plan',
      departure_time: jobData.departure_time ? `${jobData.job_date || new Date().toISOString().split('T')[0]}T${jobData.departure_time}:00` : null,
      start_time: jobData.start_time ? `${jobData.job_date || new Date().toISOString().split('T')[0]}T${jobData.start_time}:00` : new Date().toISOString(),
      end_time: jobData.end_time ? `${jobData.job_date || new Date().toISOString().split('T')[0]}T${jobData.end_time}:00` : new Date().toISOString(),
      address_street: jobData.address_street || '',
      address_city: jobData.address_city,
      address_postal_code: jobData.address_postal_code,
      expected_volume: jobData.volume_m3 || 0,
      pipe_length: jobData.pipe_length || 0,
      construction_type: 'Standard', // Default value
      dispatcher_notes: jobData.notes,
      pumpist_notes: jobData.pumpist_notes,
      // Required fields with defaults
      price_list_id: '00000000-0000-0000-0000-000000000001', // We'll need a default price list
    };

    const { data: job, error } = await supabase
      .from('jobs')
      .insert(dbJobData)
      .select(`
        *,
        client:clients(*),
        pumpist:users!jobs_pumpist_id_fkey(*),
        pump_type:pump_types!jobs_pump_type_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/planning`);
    return { success: true, data: job as Job };
  } catch (error) {
    console.error('Error creating job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create job'
    };
  }
}

// Update an existing job
export async function updateJob(organizationSlug: string, jobId: string, jobData: Partial<Job>) {
  const user = await checkCalendarPermissions();
  const supabase = await createClient();

  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        ...jobData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('organization_id', user.organization_id)
      .select(`
        *,
        client:clients(*),
        pumpist:users!jobs_pumpist_id_fkey(*),
        pump_type:pump_types!jobs_pump_type_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/planning`);
    return { success: true, data: job as Job };
  } catch (error) {
    console.error('Error updating job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update job'
    };
  }
}

// Move job to different time/driver
export async function moveJob(
  organizationSlug: string,
  jobId: string,
  newStartTime: string,
  newDriverId?: string
) {
  const user = await checkCalendarPermissions();
  const supabase = await createClient();

  try {
    // First get the current job to calculate new end time
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !currentJob) {
      throw new Error('Job not found');
    }

    // Calculate duration and new end time
    const currentStart = currentJob.departure_time || currentJob.start_time;
    const currentEnd = currentJob.end_time;
    let newEndTime: string | undefined;

    if (currentStart && currentEnd) {
      const currentStartMinutes = parseInt(currentStart.split(':')[0]) * 60 + parseInt(currentStart.split(':')[1]);
      const currentEndMinutes = parseInt(currentEnd.split(':')[0]) * 60 + parseInt(currentEnd.split(':')[1]);
      const durationMinutes = currentEndMinutes - currentStartMinutes;

      const newStartMinutes = parseInt(newStartTime.split(':')[0]) * 60 + parseInt(newStartTime.split(':')[1]);
      const newEndMinutes = newStartMinutes + durationMinutes;

      const hours = Math.floor(newEndMinutes / 60);
      const minutes = newEndMinutes % 60;
      newEndTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const updateData: Partial<Job> = {
      departure_time: currentJob.departure_time ? newStartTime : undefined,
      start_time: !currentJob.departure_time ? newStartTime : currentJob.start_time,
      end_time: newEndTime,
      pumpist_id: newDriverId || currentJob.pumpist_id,
    };

    const { data: job, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .eq('organization_id', user.organization_id)
      .select(`
        *,
        client:clients(*),
        pumpist:users!jobs_pumpist_id_fkey(*),
        pump_type:pump_types!jobs_pump_type_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/planning`);
    return { success: true, data: job as Job };
  } catch (error) {
    console.error('Error moving job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move job'
    };
  }
}

// Delete a job
export async function deleteJob(organizationSlug: string, jobId: string) {
  const user = await checkCalendarPermissions();
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/planning`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete job'
    };
  }
}

// Update job status
export async function updateJobStatus(organizationSlug: string, jobId: string, status: JobStatus) {
  const user = await checkCalendarPermissions();
  const supabase = await createClient();

  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('organization_id', user.organization_id)
      .select(`
        *,
        client:clients(*),
        pumpist:users!jobs_pumpist_id_fkey(*),
        pump_type:pump_types!jobs_pump_type_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    revalidatePath(`/${organizationSlug}/planning`);
    return { success: true, data: job as Job };
  } catch (error) {
    console.error('Error updating job status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update job status'
    };
  }
}

// Get clients for job assignment
export async function getOrganizationClientsForCalendar(organizationSlug: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, phone, address_city')
      .eq('organization_id', user.organization_id)
      .order('name', { ascending: true });

    if (error) throw error;

    return clients || [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
}

// Get pump types for job assignment
export async function getOrganizationPumpTypesForCalendar(organizationSlug: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  try {
    const { data: pumpTypes, error } = await supabase
      .from('pump_types')
      .select('id, name, capacity')
      .eq('organization_id', user.organization_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return pumpTypes || [];
  } catch (error) {
    console.error('Error fetching pump types:', error);
    return [];
  }
}