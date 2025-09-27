'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import moment from 'moment';
import { CalendarHeader } from './calendar-header';
import { CalendarGrid } from './calendar-grid';
import { JobModal } from './job-modal';
import { ConflictDialog } from './conflict-dialog';
import { getJobsForDate, moveJob, updateJobStatus, createJob, updateJob, deleteJob } from '@/lib/actions/calendar';
import { convertJobToCalendarJob, detectJobConflicts } from '@/lib/types/calendar';
import type { Job, Driver, CalendarView, ZoomLevel, CalendarJob, ConflictInfo } from '@/lib/types/calendar';
import { timeToMinutes, minutesToTime, TIME_SLOT_MINUTES } from '@/lib/types/calendar';
import { toast } from '@/components/ui/use-toast';

interface CalendarViewProps {
  organizationSlug: string;
  initialJobs: Job[];
  drivers: Driver[];
  selectedDate: string;
  initialView: CalendarView;
  currentUser: {
    id: string;
    roles: string[];
  };
}

interface CalendarViewPropsExtended extends CalendarViewProps {
  onDateChange?: (date: string) => void;
  onViewChange?: (view: CalendarView) => void;
  onZoomChange?: (zoom: ZoomLevel) => void;
  onPreviousDay?: () => void;
  onNextDay?: () => void;
  onToday?: () => void;
  onRefresh?: () => void;
  getConflicts?: () => ConflictInfo[];
  exposeHandlers?: (handlers: {
    selectedDate: string;
    view: CalendarView;
    zoomLevel: ZoomLevel;
    conflicts: ConflictInfo[];
    onDateChange: (date: string) => void;
    onViewChange: (view: CalendarView) => void;
    onZoomChange: (zoom: ZoomLevel) => void;
    onPreviousDay: () => void;
    onNextDay: () => void;
    onToday: () => void;
    onRefresh: () => void;
  }) => void;
}

export function CalendarView({
  organizationSlug,
  initialJobs,
  drivers,
  selectedDate: initialDate,
  initialView,
  currentUser,
  onDateChange: externalOnDateChange,
  onViewChange: externalOnViewChange,
  onZoomChange: externalOnZoomChange,
  onPreviousDay: externalOnPreviousDay,
  onNextDay: externalOnNextDay,
  onToday: externalOnToday,
  onRefresh: externalOnRefresh,
  getConflicts: externalGetConflicts,
  exposeHandlers,
}: CalendarViewPropsExtended) {
  // State management
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const [jobs, setJobs] = useState<CalendarJob[]>(
    initialJobs.map(convertJobToCalendarJob)
  );
  const [selectedJob, setSelectedJob] = useState<CalendarJob | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobModalMode, setJobModalMode] = useState<'create' | 'edit'>('create');
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    jobId: string;
    newTime: string;
    newDriverId?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clearDragSelection, setClearDragSelection] = useState(false);

  // Helper function to add hours to a time string using moment
  const addHoursToTime = (timeString: string, hours: number): string => {
    if (!timeString) return '';
    return moment(timeString, 'HH:mm').add(hours, 'hours').format('HH:mm');
  };

  // Fetch jobs for selected date
  const fetchJobsForDate = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const fetchedJobs = await getJobsForDate(organizationSlug, date);
      setJobs(fetchedJobs.map(convertJobToCalendarJob));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch jobs for selected date',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  // Handle date change
  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate);
    fetchJobsForDate(newDate);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('date', newDate);
    window.history.pushState({}, '', url);
    externalOnDateChange?.(newDate);
  }, [fetchJobsForDate, externalOnDateChange]);

  // Handle view change
  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.pushState({}, '', url);
    externalOnViewChange?.(newView);
  }, [externalOnViewChange]);

  // Navigation handlers
  const handlePreviousDay = useCallback(() => {
    const newDate = moment(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
    handleDateChange(newDate);
    externalOnPreviousDay?.();
  }, [selectedDate, handleDateChange, externalOnPreviousDay]);
  
  const handleNextDay = useCallback(() => {
    const newDate = moment(selectedDate).add(1, 'day').format('YYYY-MM-DD');
    handleDateChange(newDate);
    externalOnNextDay?.();
  }, [selectedDate, handleDateChange, externalOnNextDay]);
  
  const handleToday = useCallback(() => {
    const newDate = moment().format('YYYY-MM-DD');
    handleDateChange(newDate);
    externalOnToday?.();
  }, [handleDateChange, externalOnToday]);
  
  const handleZoomChange = useCallback((newZoom: ZoomLevel) => {
    setZoomLevel(newZoom);
    externalOnZoomChange?.(newZoom);
  }, [externalOnZoomChange]);
  
  const handleRefresh = useCallback(() => {
    fetchJobsForDate(selectedDate);
    externalOnRefresh?.();
  }, [fetchJobsForDate, selectedDate, externalOnRefresh]);

  // Calculate conflicts whenever jobs change
  useEffect(() => {
    const allConflicts: ConflictInfo[] = [];
    drivers.forEach(driver => {
      const driverConflicts = detectJobConflicts(jobs, driver.id);
      allConflicts.push(...driverConflicts);
    });
    setConflicts(allConflicts);
  }, [jobs, drivers]);

  // Expose handlers to parent component
  useEffect(() => {
    if (exposeHandlers) {
      exposeHandlers({
        selectedDate,
        view,
        zoomLevel,
        conflicts,
        onDateChange: handleDateChange,
        onViewChange: handleViewChange,
        onZoomChange: handleZoomChange,
        onPreviousDay: handlePreviousDay,
        onNextDay: handleNextDay,
        onToday: handleToday,
        onRefresh: handleRefresh,
      });
    }
  }, [exposeHandlers, selectedDate, view, zoomLevel, conflicts, handleDateChange, handleViewChange, handleZoomChange, handlePreviousDay, handleNextDay, handleToday, handleRefresh]);

  // Job manipulation handlers
  const handleJobClick = useCallback((job: CalendarJob) => {
    setSelectedJob(job);
  }, []);

  const handleJobDoubleClick = useCallback((job: CalendarJob) => {
    if (currentUser.roles.some(role => ['dispatcher', 'manager', 'organization_admin'].includes(role))) {
      setSelectedJob(job);
      setJobModalMode('edit');
      setIsJobModalOpen(true);
    }
  }, [currentUser.roles]);

  const handleCreateJob = useCallback((time: string, driverId?: string) => {
    if (currentUser.roles.some(role => ['dispatcher', 'manager', 'organization_admin'].includes(role))) {
      setSelectedJob(null);
      setJobModalMode('create');
      setIsJobModalOpen(true);
      // You can set initial values here based on time and driverId
      // Preset the time and driverId
      setSelectedJob({
        id: '',
        start_time: time,
        end_time: addHoursToTime(time, 2),
        pumpist_id: driverId,
      } as CalendarJob);
    }
  }, [currentUser.roles]);

  const handleCreateJobWithTimeRange = useCallback((startTime: string, endTime: string, driverId?: string) => {
    if (currentUser.roles.some(role => ['dispatcher', 'manager', 'organization_admin'].includes(role))) {
      setSelectedJob(null);
      setJobModalMode('create');
      setIsJobModalOpen(true);
      // Preset the time range and driverId
      setSelectedJob({
        id: '',
        start_time: startTime,
        end_time: minutesToTime(timeToMinutes(endTime) + TIME_SLOT_MINUTES),
        pumpist_id: driverId,
      } as CalendarJob);
    }
  }, [currentUser.roles]);

  const handleJobMove = useCallback(async (jobId: string, newTime: string, newDriverId?: string) => {
    // Check for conflicts first
    const movingJob = jobs.find(j => j.id === jobId);
    if (!movingJob) return;

    // Create a temporary moved job to check conflicts
    const tempJob = { ...movingJob };
    if (newDriverId) tempJob.pumpist_id = newDriverId;

    // For now, accept the move - real conflict detection would happen here
    setPendingMove({ jobId, newTime, newDriverId });

    try {
      const result = await moveJob(organizationSlug, jobId, newTime, newDriverId);
      if (result.success && result.data) {
        // Update local state optimistically
        setJobs(prev => prev.map(job =>
          job.id === jobId ? convertJobToCalendarJob(result.data) : job
        ));
        toast({
          title: 'Success',
          description: 'Job moved successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to move job',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move job',
        variant: 'destructive',
      });
    } finally {
      setPendingMove(null);
    }
  }, [jobs, organizationSlug]);

  const handleStatusChange = useCallback(async (jobId: string, newStatus: Job['status']) => {
    try {
      const result = await updateJobStatus(organizationSlug, jobId, newStatus);
      if (result.success && result.data) {
        setJobs(prev => prev.map(job =>
          job.id === jobId ? convertJobToCalendarJob(result.data) : job
        ));
        toast({
          title: 'Success',
          description: 'Job status updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update job status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
    }
  }, [organizationSlug]);

  const handleJobSave = useCallback(async (jobData: Partial<Job>) => {
    try {
      let result;
      if (jobModalMode === 'create') {
        result = await createJob(organizationSlug, {
          ...jobData,
          job_date: selectedDate,
        });
      } else if (selectedJob) {
        result = await updateJob(organizationSlug, selectedJob.id, jobData);
      }

      if (result?.success && result.data) {
        if (jobModalMode === 'create') {
          setJobs(prev => [...prev, convertJobToCalendarJob(result.data)]);
        } else {
          setJobs(prev => prev.map(job =>
            job.id === selectedJob?.id ? convertJobToCalendarJob(result.data) : job
          ));
        }
        setIsJobModalOpen(false);
        // Clear drag selection after successful job creation
        setClearDragSelection(true);
        setTimeout(() => setClearDragSelection(false), 100);
        toast({
          title: 'Success',
          description: `Job ${jobModalMode === 'create' ? 'created' : 'updated'} successfully`,
        });
      } else {
        toast({
          title: 'Error',
          description: result?.error || `Failed to ${jobModalMode} job`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${jobModalMode} job`,
        variant: 'destructive',
      });
    }
  }, [jobModalMode, organizationSlug, selectedDate, selectedJob]);

  const handleJobDelete = useCallback(async (jobId: string) => {
    try {
      const result = await deleteJob(organizationSlug, jobId);
      if (result.success) {
        setJobs(prev => prev.filter(job => job.id !== jobId));
        setIsJobModalOpen(false);
        toast({
          title: 'Success',
          description: 'Job deleted successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete job',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      });
    }
  }, [organizationSlug]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <CalendarGrid
            jobs={jobs}
            drivers={drivers}
            selectedDate={selectedDate}
            view={view}
            zoomLevel={zoomLevel}
            selectedJob={selectedJob}
            onJobClick={handleJobClick}
            onJobDoubleClick={handleJobDoubleClick}
            onCreateJob={handleCreateJob}
            onCreateJobWithTimeRange={handleCreateJobWithTimeRange}
            onJobMove={handleJobMove}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
            currentUserRoles={currentUser.roles}
            clearDragSelection={clearDragSelection}
          />
        </div>

        {isJobModalOpen && (
          <JobModal
            job={selectedJob}
            mode={jobModalMode}
            organizationSlug={organizationSlug}
            selectedDate={selectedDate}
            onSave={handleJobSave}
            onDelete={handleJobDelete}
            onClose={() => {
              setIsJobModalOpen(false);
              // Clear drag selection when modal is closed without saving
              setClearDragSelection(true);
              setTimeout(() => setClearDragSelection(false), 100);
            }}
          />
        )}

        {isConflictDialogOpen && pendingMove && (
          <ConflictDialog
            conflicts={conflicts.filter(c => c.jobs.includes(pendingMove.jobId))}
            onAccept={() => {
              setIsConflictDialogOpen(false);
              setPendingMove(null);
            }}
            onCancel={() => {
              setIsConflictDialogOpen(false);
              setPendingMove(null);
            }}
          />
        )}
      </div>
    </DndProvider>
  );
}