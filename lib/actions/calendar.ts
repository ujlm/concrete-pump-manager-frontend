'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/dashboard';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Job, Driver, JobStatus } from '@/lib/types/calendar';
import { calculateDepartureTime } from '@/lib/types/calendar';

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
        driver:users!jobs_driver_id_fkey(*),
        pump_type:pump_types!jobs_pump_type_id_fkey(*)
      `)
      .eq('organization_id', user.organization_id)
      .gte('start_time', `${date}T00:00:00`)
      .lt('start_time', `${date}T23:59:59`)
      .order('start_time', { ascending: true, nullsFirst: false });

    if (error) throw error;

    // Transform the data to match our Job interface
    const transformedJobs = jobs?.map(job => ({
      ...job,
      // Convert timestamps to time strings for the frontend
      start_time: job.start_time ? new Date(job.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      end_time: job.end_time ? new Date(job.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      // Map database fields to expected interface fields
      volume_expected: job.volume_expected,
      pipe_expected: job.pipe_expected,
      travel_time_minutes: job.travel_time_minutes,
      notes: job.dispatcher_notes || '',
      proprietary_concrete: job.proprietary_concrete || false,
      // Map pumpist to driver for backward compatibility
      pumpist_id: job.driver_id,
      pumpist: job.driver,
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
      .contains('roles', ['driver'])
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
    // Get the appropriate price list ID
    let priceListId = jobData.price_list_id; // First, use the explicitly selected price list
    
    // If no price list selected, try to get the client's default price list
    if (!priceListId && jobData.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('price_list_id')
        .eq('id', jobData.client_id)
        .eq('organization_id', user.organization_id)
        .single();
      
      priceListId = client?.price_list_id;
    }
    
    // If still no price list, get the organization's first active price list
    if (!priceListId) {
      const { data: priceList } = await supabase
        .from('price_lists')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      priceListId = priceList?.id;
    }
    
    // If still no price list, we'll need to create a default one or make it optional
    if (!priceListId) {
      throw new Error('No price list found. Please create a price list first in Settings > Price Lists.');
    }

    // Transform frontend data to database schema
    const dbJobData = {
      organization_id: user.organization_id,
      client_id: jobData.client_id,
      driver_id: jobData.pumpist_id || jobData.driver_id, // Map pumpist_id from modal to driver_id
      pump_type_id: jobData.pump_type_id,
      job_status: jobData.status || jobData.job_status || 'planning',
      planning_status: 'planned',
      start_time: jobData.start_time ? `${jobData.job_date || new Date().toISOString().split('T')[0]}T${jobData.start_time}:00` : new Date().toISOString(),
      end_time: jobData.end_time ? `${jobData.job_date || new Date().toISOString().split('T')[0]}T${jobData.end_time}:00` : new Date().toISOString(),
      address_street: jobData.address_street || '',
      address_city: jobData.address_city,
      address_postal_code: jobData.address_postal_code,
      volume_expected: jobData.volume_m3 || jobData.volume_expected || 0,
      pipe_expected: jobData.pipe_length || jobData.pipe_expected || 35,
      travel_time_minutes: jobData.travel_time_minutes || 0,
      proprietary_concrete: jobData.proprietary_concrete || false,
      dispatcher_notes: jobData.notes,
      pumpist_notes: jobData.pumpist_notes,
      price_list_id: priceListId,
    };

    const { data: job, error } = await supabase
      .from('jobs')
      .insert(dbJobData)
      .select(`
        *,
        client:clients(*),
        driver:users!jobs_driver_id_fkey(*),
        pump_type:pump_types!jobs_pump_type_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    // Transform the job data to match frontend expectations (same as getJobsForDate)
    const transformedJob = {
      ...job,
      // Convert timestamps to time strings for the frontend
      start_time: job.start_time ? new Date(job.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      end_time: job.end_time ? new Date(job.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      // Extract date for job_date field
      job_date: job.start_time ? new Date(job.start_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      // Map database fields to expected interface fields
      volume_expected: job.volume_expected,
      pipe_expected: job.pipe_expected,
      travel_time_minutes: job.travel_time_minutes,
      notes: job.dispatcher_notes || '',
      proprietary_concrete: job.proprietary_concrete || false,
      // Map pumpist to driver for backward compatibility
      pumpist_id: job.driver_id,
      pumpist: job.driver,
    };

    revalidatePath(`/${organizationSlug}/planning`);
    return { success: true, data: transformedJob as Job };
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
  console.log('🔧 updateJob called with:', {
    organizationSlug,
    jobId,
    jobData
  });

  const user = await checkCalendarPermissions();
  const supabase = await createClient();

  try {
    // Transform time strings to full timestamps if needed
    const updateData = { ...jobData };
    
    // Get current job to preserve date when updating times
    if (jobData.start_time || jobData.end_time) {
      const { data: currentJob, error: fetchError } = await supabase
        .from('jobs')
        .select('start_time, end_time')
        .eq('id', jobId)
        .eq('organization_id', user.organization_id)
        .single();

      if (fetchError || !currentJob) {
        throw new Error('Job not found');
      }

      console.log('📋 Current job timestamps:', {
        start_time: currentJob.start_time,
        end_time: currentJob.end_time
      });

      // Convert time strings to full timestamps
      if (jobData.start_time && jobData.start_time.includes(':') && !jobData.start_time.includes('T')) {
        const currentDate = new Date(currentJob.start_time);
        const jobDate = currentDate.toISOString().split('T')[0];
        updateData.start_time = `${jobDate}T${jobData.start_time}:00`;
        console.log('🕐 Converted start_time:', updateData.start_time);
      }

      if (jobData.end_time && jobData.end_time.includes(':') && !jobData.end_time.includes('T')) {
        const currentDate = new Date(currentJob.end_time);
        const jobDate = currentDate.toISOString().split('T')[0];
        updateData.end_time = `${jobDate}T${jobData.end_time}:00`;
        console.log('🕐 Converted end_time:', updateData.end_time);
      }
    }

    console.log('💾 Final update data:', updateData);

    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('organization_id', user.organization_id)
      .select(`
        *,
        client:clients(*),
        driver:users!jobs_driver_id_fkey(*),
        pump_type:pump_types!jobs_pump_type_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('❌ Database update error:', error);
      throw error;
    }

    console.log('✅ Database update successful, raw job data:', job);

    // Transform the job data to match frontend expectations (same as createJob and moveJob)
    const transformedJob = {
      ...job,
      // Convert timestamps to time strings for the frontend
      start_time: job.start_time ? new Date(job.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      end_time: job.end_time ? new Date(job.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      // Extract date for job_date field
      job_date: job.start_time ? new Date(job.start_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      // Map database fields to expected interface fields
      volume_expected: job.volume_expected,
      pipe_expected: job.pipe_expected,
      travel_time_minutes: job.travel_time_minutes,
      notes: job.dispatcher_notes || '',
      proprietary_concrete: job.proprietary_concrete || false,
      // Map pumpist to driver for backward compatibility
      pumpist_id: job.driver_id,
      pumpist: job.driver,
    };

    console.log('🎯 Transformed job for frontend:', {
      id: transformedJob.id,
      start_time: transformedJob.start_time,
      end_time: transformedJob.end_time,
      driver_id: transformedJob.driver_id,
      pumpist_id: transformedJob.pumpist_id
    });

    revalidatePath(`/${organizationSlug}/planning`);
    return { success: true, data: transformedJob as Job };
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
  console.log('🚀 moveJob called with:', {
    organizationSlug,
    jobId,
    newStartTime,
    newDriverId
  });

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
      console.error('❌ Job not found:', { fetchError, jobId });
      throw new Error('Job not found');
    }

    console.log('📋 Current job data:', {
      id: currentJob.id,
      start_time: currentJob.start_time,
      end_time: currentJob.end_time,
      driver_id: currentJob.driver_id
    });

    // Calculate duration and new end time
    // Parse current timestamps to get duration
    const currentStartDate = new Date(currentJob.start_time);
    const currentEndDate = new Date(currentJob.end_time);
    const durationMs = currentEndDate.getTime() - currentStartDate.getTime();

    console.log('⏰ Time calculations:', {
      currentStartDate: currentStartDate.toISOString(),
      currentEndDate: currentEndDate.toISOString(),
      durationMs,
      durationMinutes: durationMs / (1000 * 60)
    });

    // Create new timestamps for the same date but different time
    const jobDate = currentStartDate.toISOString().split('T')[0]; // Get current job date
    const newStartTimestamp = `${jobDate}T${newStartTime}:00`;
    const newStartDate = new Date(newStartTimestamp);
    const newEndDate = new Date(newStartDate.getTime() + durationMs);

    console.log('🔄 New time calculations:', {
      jobDate,
      newStartTimestamp,
      newStartDate: newStartDate.toISOString(),
      newEndDate: newEndDate.toISOString()
    });

    const updateData = {
      start_time: newStartDate.toISOString(),
      end_time: newEndDate.toISOString(),
      driver_id: newDriverId || currentJob.driver_id,
    };

    console.log('💾 Update data:', updateData);

    const { data: job, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .eq('organization_id', user.organization_id)
      .select(`
        *,
        client:clients(*),
        driver:users!jobs_driver_id_fkey(*),
        pump_type:pump_types!jobs_pump_type_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('❌ Database update error:', error);
      throw error;
    }

    console.log('✅ Database update successful, raw job data:', job);

    // Transform the job data to match frontend expectations (same as createJob)
    const transformedJob = {
      ...job,
      // Convert timestamps to time strings for the frontend
      start_time: job.start_time ? new Date(job.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      end_time: job.end_time ? new Date(job.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null,
      // Extract date for job_date field
      job_date: job.start_time ? new Date(job.start_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      // Map database fields to expected interface fields
      volume_expected: job.volume_expected,
      pipe_expected: job.pipe_expected,
      travel_time_minutes: job.travel_time_minutes,
      notes: job.dispatcher_notes || '',
      proprietary_concrete: job.proprietary_concrete || false,
      // Map pumpist to driver for backward compatibility
      pumpist_id: job.driver_id,
      pumpist: job.driver,
    };

    console.log('🎯 Transformed job for frontend:', {
      id: transformedJob.id,
      start_time: transformedJob.start_time,
      end_time: transformedJob.end_time,
      driver_id: transformedJob.driver_id,
      pumpist_id: transformedJob.pumpist_id
    });

    revalidatePath(`/${organizationSlug}/planning`);
    return { success: true, data: transformedJob as Job };
  } catch (error) {
    console.error('❌ Error moving job:', error);
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
        job_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('organization_id', user.organization_id)
      .select(`
        *,
        client:clients(*),
        driver:users!jobs_driver_id_fkey(*),
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
      .select('id, name, phone, address_city, price_list_id')
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