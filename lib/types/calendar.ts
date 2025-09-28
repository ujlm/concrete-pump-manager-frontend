import { format, startOfDay } from 'date-fns';

export type JobStatus = 'planning' | 'received' | 'in_progress' | 'completed' | 'invoiced' | 'cancelled';

export interface Job {
  id: string;
  organization_id: string;
  client_id?: string;
  client?: {
    name: string;
    phone?: string;
  };
  driver_id?: string;
  driver?: {
    first_name: string;
    last_name: string;
  };
  pump_type_id?: string;
  pump_type?: {
    name: string;
    capacity?: number;
  };
  job_status: JobStatus;
  planning_status: 'planned' | 'assigned';
  job_date: string; // ISO date string
  start_time?: string; // HH:mm format
  end_time?: string; // HH:mm format
  volume_expected?: number;
  pipe_expected?: number;
  // Modal field aliases (for backward compatibility)
  volume_m3?: number; // Maps to volume_expected
  pipe_length?: number; // Maps to pipe_expected
  pumpist_id?: string; // Maps to driver_id
  status?: JobStatus; // Maps to job_status
  price_list_id?: string; // Price list for the job
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  travel_time_minutes?: number;
  notes?: string;
  dispatcher_notes?: string;
  pumpist_notes?: string;
  proprietary_concrete: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
}

export interface TimeSlot {
  time: string; // HH:mm format
  displayTime: string; // formatted time for display
}

export interface CalendarJob extends Job {
  startMinutes: number; // minutes from start of day
  endMinutes: number; // minutes from start of day
  durationMinutes: number; // total duration
  travelMinutes: number; // travel time
  workMinutes: number; // actual work time
  gridRow: number; // grid position
  gridSpan: number; // grid span
  // Backward compatibility fields
  pumpist_id?: string;
  pumpist?: {
    first_name: string;
    last_name: string;
  };
  status?: JobStatus;
  volume_m3?: number;
  pipe_length?: number;
  is_concrete_supplier_job?: boolean;
}

export interface ConflictInfo {
  type: 'overlap' | 'gap' | 'travel_time';
  severity: 'warning' | 'error';
  message: string;
  jobs: string[]; // job IDs involved
}

export type CalendarView = 'planned' | 'assigned' | 'split';
export type ZoomLevel = 'hour' | 'day' | 'week';

// Time utility functions
export const TIME_SLOT_MINUTES = 15;
export const WORK_DAY_START = 5; // 5 AM
export const WORK_DAY_END = 21; // 9 PM
// Height of a single time slot row in pixels (Tailwind h-8 = 32px)
export const PX_PER_TIME_SLOT = 32;

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper function to calculate departure time based on start_time and travel_time_minutes
export function calculateDepartureTime(startTime: string | undefined, travelTimeMinutes: number = 0): string | undefined {
  if (!startTime || travelTimeMinutes <= 0) {
    return startTime;
  }
  
  const startMinutes = timeToMinutes(startTime);
  const departureMinutes = Math.max(0, startMinutes - travelTimeMinutes);
  return minutesToTime(departureMinutes);
}

export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = WORK_DAY_START * 60;
  const endMinutes = WORK_DAY_END * 60;

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += TIME_SLOT_MINUTES) {
    const time = minutesToTime(minutes);
    const displayTime = format(
      startOfDay(new Date()).setHours(Math.floor(minutes / 60), minutes % 60),
      'HH:mm'
    );

    slots.push({ time, displayTime });
  }

  return slots;
}

export function calculateJobGridPosition(job: Job): { row: number; span: number } {
  const departureTime = calculateDepartureTime(job.start_time, job.travel_time_minutes);
  const startTime = departureTime || job.start_time;
  const endTime = job.end_time;

  if (!startTime || !endTime) {
    return { row: 1, span: 1 };
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;

  const workDayStartMinutes = WORK_DAY_START * 60;
  const gridStartMinutes = startMinutes - workDayStartMinutes;

  const row = Math.floor(gridStartMinutes / TIME_SLOT_MINUTES) + 1;
  const span = Math.ceil(durationMinutes / TIME_SLOT_MINUTES);

  return { row: Math.max(1, row), span: Math.max(1, span) };
}

export function convertJobToCalendarJob(job: Job): CalendarJob {
  const departureTime = calculateDepartureTime(job.start_time, job.travel_time_minutes);
  const startTime = departureTime || job.start_time;
  const endTime = job.end_time;

  const startMinutes = startTime ? timeToMinutes(startTime) : 0;
  const endMinutes = endTime ? timeToMinutes(endTime) : startMinutes + 60; // Default 1 hour
  const durationMinutes = endMinutes - startMinutes;
  const travelMinutes = job.travel_time_minutes || 0;
  const workMinutes = durationMinutes - travelMinutes;

  const { row, span } = calculateJobGridPosition(job);

  return {
    ...job,
    startMinutes,
    endMinutes,
    durationMinutes,
    travelMinutes,
    workMinutes,
    gridRow: row,
    gridSpan: span,
    // Backward compatibility mappings
    pumpist_id: job.driver_id,
    pumpist: job.driver,
    status: job.job_status,
    volume_m3: job.volume_expected,
    pipe_length: job.pipe_expected,
    is_concrete_supplier_job: job.proprietary_concrete,
  };
}

export function detectJobConflicts(jobs: CalendarJob[], driverId: string): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const driverJobs = jobs
    .filter(job => job.pumpist_id === driverId)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // Check for overlaps
  for (let i = 0; i < driverJobs.length - 1; i++) {
    const currentJob = driverJobs[i];
    const nextJob = driverJobs[i + 1];

    if (currentJob.endMinutes > nextJob.startMinutes) {
      conflicts.push({
        type: 'overlap',
        severity: currentJob.job_status === 'planning' || nextJob.job_status === 'planning' ? 'error' : 'warning',
        message: `Jobs overlap by ${currentJob.endMinutes - nextJob.startMinutes} minutes`,
        jobs: [currentJob.id, nextJob.id],
      });
    }
  }

  return conflicts;
}

export function getStatusColor(status: JobStatus): string {
  switch (status) {
    case 'planning':
      return 'bg-gray-200 border-gray-300 text-gray-700';
    case 'received':
      return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'in_progress':
      return 'bg-purple-100 border-purple-300 text-purple-800';
    case 'completed':
      return 'bg-emerald-100 border-emerald-300 text-emerald-800';
    case 'invoiced':
      return 'bg-green-100 border-green-300 text-green-800';
    case 'cancelled':
      return 'bg-red-100 border-red-300 text-red-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-700';
  }
}

export function getStatusLabel(status: JobStatus): string {
  switch (status) {
    case 'planning':
      return 'Planning';
    case 'received':
      return 'Received';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'invoiced':
      return 'Invoiced';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}