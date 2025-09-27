'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { generateTimeSlots } from '@/lib/types/calendar';
import { DriverColumn } from './driver-column';
import { CurrentTimeLine } from './current-time-line';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { CalendarJob, Driver, CalendarView, ZoomLevel } from '@/lib/types/calendar';

interface CalendarGridProps {
  jobs: CalendarJob[];
  drivers: Driver[];
  selectedDate: string;
  view: CalendarView;
  zoomLevel: ZoomLevel;
  selectedJob: CalendarJob | null;
  onJobClick: (job: CalendarJob) => void;
  onJobDoubleClick: (job: CalendarJob) => void;
  onCreateJob: (time: string, driverId?: string) => void;
  onCreateJobWithTimeRange?: (startTime: string, endTime: string, driverId?: string) => void;
  onJobMove: (jobId: string, newTime: string, newDriverId?: string) => void;
  onStatusChange: (jobId: string, newStatus: CalendarJob['status']) => void;
  isLoading: boolean;
  currentUserRoles: string[];
  clearDragSelection?: boolean; // Signal to clear the drag selection
}

export function CalendarGrid(props: CalendarGridProps) {
  const {
    jobs,
    drivers,
    selectedDate,
    view,
    selectedJob,
    onJobClick,
    onJobDoubleClick,
    onCreateJob,
    onCreateJobWithTimeRange,
    onJobMove,
    onStatusChange,
    isLoading,
    currentUserRoles,
    clearDragSelection,
  } = props;
  const timeSlots = generateTimeSlots();
  const canManageJobs = currentUserRoles.some(role =>
    ['dispatcher', 'manager', 'organization_admin'].includes(role)
  );

  // Drag selection state
  const [dragSelection, setDragSelection] = useState<{
    isActive: boolean;
    startTime?: string;
    endTime?: string;
    driverId?: string;
    showHighlight?: boolean; // Keep highlight visible even when not actively dragging
  }>({
    isActive: false,
    showHighlight: false,
  });

  // Handle drag selection start
  const handleDragSelectionStart = useCallback((time: string, driverId?: string) => {
    setDragSelection({
      isActive: true,
      startTime: time,
      endTime: time,
      driverId,
      showHighlight: true,
    });
  }, []);

  // Handle drag selection update
  const handleDragSelectionUpdate = useCallback((time: string, driverId?: string) => {
    setDragSelection(prev => {
      // Only update if we're dragging in the same driver column
      if (prev.isActive && prev.driverId === driverId) {
        return {
          ...prev,
          endTime: time,
        };
      }
      return prev;
    });
  }, []);

  // Handle drag selection end
  const handleDragSelectionEnd = useCallback(() => {
    if (dragSelection.isActive && dragSelection.startTime && dragSelection.endTime && onCreateJobWithTimeRange) {
      const startTime = dragSelection.startTime;
      const endTime = dragSelection.endTime;
      
      // Ensure proper ordering (start should be earlier than end)
      const actualStartTime = startTime <= endTime ? startTime : endTime;
      const actualEndTime = startTime <= endTime ? endTime : startTime;
      
      // Only create job if there's a meaningful time range (at least 15 minutes)
      if (actualStartTime !== actualEndTime) {
        onCreateJobWithTimeRange(actualStartTime, actualEndTime, dragSelection.driverId);
        // Keep the selection highlighted but mark as not actively dragging
        setDragSelection(prev => ({
          ...prev,
          isActive: false,
          showHighlight: true, // Keep highlight visible when modal opens
        }));
        return;
      }
    }
    
    // Clear selection if no job was created
    setDragSelection({ isActive: false, showHighlight: false });
  }, [dragSelection, onCreateJobWithTimeRange]);

  // Handle mouse up anywhere to end drag selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragSelection.isActive) {
        handleDragSelectionEnd();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragSelection.isActive, handleDragSelectionEnd]);

  // Clear drag selection when requested from parent
  useEffect(() => {
    if (clearDragSelection) {
      setDragSelection({ isActive: false, showHighlight: false });
    }
  }, [clearDragSelection]);

  // Filter jobs based on view
  const getJobsForView = (viewType: 'planned' | 'assigned') => {
    return jobs.filter(job => {
      if (viewType === 'planned') {
        return job.status === 'to_plan';
      } else {
        return job.status !== 'to_plan';
      }
    });
  };

  const plannedJobs = view === 'planned' || view === 'split' ? getJobsForView('planned') : [];
  const assignedJobs = view === 'assigned' || view === 'split' ? getJobsForView('assigned') : [];
  const allJobs = view === 'split' ? jobs : (view === 'planned' ? plannedJobs : assignedJobs);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No drivers available</p>
          <p className="text-sm">Add drivers in the user management section</p>
        </div>
      </div>
    );
  }

  // Add unassigned column to drivers list
  const allColumns = [
    ...drivers,
    {
      id: 'unassigned',
      first_name: 'Unassigned',
      last_name: '',
      email: '',
      phone: '',
      is_active: true,
    }
  ];

  if (view === 'split') {
    return (
      <div className="flex flex-col h-full overflow-hidden min-h-0">
        {/* Assigned Jobs Section - Top Half */}
        <div className="flex-1 border-b min-h-0">
          <div className="sticky top-0 z-10 bg-background border-b px-2 sm:px-4 py-2">
            <h3 className="font-semibold text-sm text-green-800">
              Assigned Jobs ({assignedJobs.length})
            </h3>
          </div>
          <div className="h-full overflow-hidden flex flex-col min-h-0">
            {/* Calendar header with driver names */}
            <div className="flex border-b bg-background sticky top-0 z-20">
              {/* Time column header */}
              <div className="flex-shrink-0 w-12 sm:w-16 border-r bg-gray-50/50 h-12 sm:h-16 flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-mono">Time</span>
              </div>
              
              {/* Driver column headers */}
              <div className="flex flex-1 overflow-x-auto">
                {allColumns.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex-shrink-0 w-48 sm:w-60 border-r bg-background h-12 sm:h-16 flex items-center p-2 sm:p-3"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        driver.id === 'unassigned' ? 'bg-gray-400' : 'bg-green-500'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-xs sm:text-sm truncate">
                          {driver.id === 'unassigned' ? 'Unassigned' : `${driver.first_name} ${driver.last_name}`.trim()}
                        </h3>
                        {driver.phone && driver.id !== 'unassigned' && (
                          <p className="text-xs text-muted-foreground truncate hidden sm:block">
                            {driver.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground bg-gray-100 rounded px-2 py-1">
                        {assignedJobs.filter(job => 
                          driver.id === 'unassigned' ? !job.pumpist_id : job.pumpist_id === driver.id
                        ).length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable assigned calendar grid */}
            <div className="flex-1 overflow-auto min-h-0">
              <CalendarSection
                jobs={assignedJobs}
                drivers={drivers}
                timeSlots={timeSlots}
                selectedDate={selectedDate}
                selectedJob={selectedJob}
                onJobClick={onJobClick}
                onJobDoubleClick={onJobDoubleClick}
                onCreateJob={onCreateJob}
                onCreateJobWithTimeRange={onCreateJobWithTimeRange}
                onJobMove={onJobMove}
                onStatusChange={onStatusChange}
                canManageJobs={canManageJobs}
                allowOverlaps={false}
                sectionType="assigned"
                dragSelection={dragSelection}
                onDragSelectionStart={handleDragSelectionStart}
                onDragSelectionUpdate={handleDragSelectionUpdate}
                onDragSelectionEnd={handleDragSelectionEnd}
              />
            </div>
          </div>
        </div>

        {/* Planned Jobs Section - Bottom Half */}
        <div className="flex-1 min-h-0">
          <div className="sticky top-0 z-10 bg-background border-b px-2 sm:px-4 py-2">
            <h3 className="font-semibold text-sm text-gray-600">
              Planned Jobs ({plannedJobs.length})
            </h3>
          </div>
          <div className="h-full overflow-hidden flex flex-col min-h-0">
            {/* Scrollable planned calendar grid */}
            <div className="flex-1 overflow-auto min-h-0">
              <CalendarSection
                jobs={plannedJobs}
                drivers={drivers}
                timeSlots={timeSlots}
                selectedDate={selectedDate}
                selectedJob={selectedJob}
                onJobClick={onJobClick}
                onJobDoubleClick={onJobDoubleClick}
                onCreateJob={onCreateJob}
                onCreateJobWithTimeRange={onCreateJobWithTimeRange}
                onJobMove={onJobMove}
                onStatusChange={onStatusChange}
                canManageJobs={canManageJobs}
                allowOverlaps={true}
                sectionType="planned"
                dragSelection={dragSelection}
                onDragSelectionStart={handleDragSelectionStart}
                onDragSelectionUpdate={handleDragSelectionUpdate}
                onDragSelectionEnd={handleDragSelectionEnd}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single view (planned or assigned)
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Calendar header with driver names */}
      <div className="flex border-b bg-background sticky top-0 z-20">
        {/* Time column header */}
        <div className="flex-shrink-0 w-12 sm:w-16 border-r bg-gray-50/50 h-12 sm:h-16 flex items-center justify-center">
          <span className="text-xs text-muted-foreground font-mono">Time</span>
        </div>
        
        {/* Driver column headers */}
        <div className="flex flex-1 overflow-x-auto">
          {allColumns.map((driver) => (
            <div
              key={driver.id}
              className="flex-shrink-0 w-48 sm:w-60 border-r bg-background h-12 sm:h-16 flex items-center p-2 sm:p-3"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  driver.id === 'unassigned' ? 'bg-gray-400' : 'bg-green-500'
                }`} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-xs sm:text-sm truncate">
                    {driver.id === 'unassigned' ? 'Unassigned' : `${driver.first_name} ${driver.last_name}`.trim()}
                  </h3>
                  {driver.phone && driver.id !== 'unassigned' && (
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">
                      {driver.phone}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground bg-gray-100 rounded px-2 py-1">
                  {allJobs.filter(job => 
                    driver.id === 'unassigned' ? !job.pumpist_id : job.pumpist_id === driver.id
                  ).length}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable calendar grid */}
      <div className="flex-1 overflow-auto">
        <CalendarSection
          jobs={allJobs}
          drivers={drivers}
          timeSlots={timeSlots}
          selectedDate={selectedDate}
          selectedJob={selectedJob}
          onJobClick={onJobClick}
          onJobDoubleClick={onJobDoubleClick}
          onCreateJob={onCreateJob}
          onCreateJobWithTimeRange={onCreateJobWithTimeRange}
          onJobMove={onJobMove}
          onStatusChange={onStatusChange}
          canManageJobs={canManageJobs}
          allowOverlaps={view === 'planned'}
          sectionType={view || 'unified'}
          dragSelection={dragSelection}
          onDragSelectionStart={handleDragSelectionStart}
          onDragSelectionUpdate={handleDragSelectionUpdate}
          onDragSelectionEnd={handleDragSelectionEnd}
        />
      </div>
    </div>
  );
}

interface CalendarSectionProps {
  jobs: CalendarJob[];
  drivers: Driver[];
  timeSlots: { time: string; displayTime: string }[];
  selectedDate: string;
  selectedJob: CalendarJob | null;
  onJobClick: (job: CalendarJob) => void;
  onJobDoubleClick: (job: CalendarJob) => void;
  onCreateJob: (time: string, driverId?: string) => void;
  onCreateJobWithTimeRange?: (startTime: string, endTime: string, driverId?: string) => void;
  onJobMove: (jobId: string, newTime: string, newDriverId?: string) => void;
  onStatusChange: (jobId: string, newStatus: CalendarJob['status']) => void;
  canManageJobs: boolean;
  allowOverlaps: boolean;
  sectionType: string;
  dragSelection?: {
    isActive: boolean;
    startTime?: string;
    endTime?: string;
    driverId?: string;
    showHighlight?: boolean;
  };
  onDragSelectionStart?: (time: string, driverId?: string) => void;
  onDragSelectionUpdate?: (time: string, driverId?: string) => void;
  onDragSelectionEnd?: () => void;
}

interface DropResult { time?: string; driverId?: string }

function CalendarSection({
  jobs,
  drivers,
  timeSlots,
  selectedDate,
  selectedJob,
  onJobClick,
  onJobDoubleClick,
  onCreateJob,
  onCreateJobWithTimeRange,
  onJobMove,
  onStatusChange,
  canManageJobs,
  allowOverlaps,
  sectionType,
  dragSelection,
  onDragSelectionStart,
  onDragSelectionUpdate,
  onDragSelectionEnd,
}: CalendarSectionProps) {
  const [, drop] = useDrop({
    accept: 'job',
    drop: (item: { id: string; type: string }, monitor) => {
      const targetElement = monitor.getDropResult() as DropResult;
      if (targetElement?.time && targetElement?.driverId) {
        onJobMove(item.id, targetElement.time, targetElement.driverId);
      }
    },
  });

  // Add unassigned column to drivers list
  const allColumns = [
    ...drivers,
    {
      id: 'unassigned',
      first_name: 'Unassigned',
      last_name: '',
      email: '',
      phone: '',
      is_active: true,
    }
  ];

  return (
    <div
      ref={drop as unknown as React.RefCallback<HTMLDivElement>}
      className="flex relative"
    >
      {/* Current time indicator line */}
      <CurrentTimeLine selectedDate={selectedDate} />
      
      {/* Time column - no header, just time slots */}
      <div className="flex-shrink-0 w-12 sm:w-16 border-r bg-gray-50/50">
        {timeSlots.map((slot) => {
          const isHourMark = slot.time.endsWith(':00');
          const isHalfHour = slot.time.endsWith(':30');

          return (
            <div
              key={slot.time}
              className={`h-8 border-gray-200 flex items-center justify-center relative ${
                isHourMark ? '' : ''
              }`}
            >
              {/* Show time label only on hour marks and half hours */}
              {(isHourMark || isHalfHour) && (
                <div className="text-xs sm:text-xs text-muted-foreground font-mono leading-none -translate-y-4">
                  <span className="hidden sm:inline">{slot.time}</span>
                  <span className="sm:hidden">{slot.time.split(':')[0]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Driver columns - no headers, just time slots */}
      <div className="flex flex-1">
        {allColumns.map((driver) => (
          <DriverColumn
            key={driver.id}
            driver={driver}
            jobs={jobs.filter(job => 
              driver.id === 'unassigned' ? !job.pumpist_id : job.pumpist_id === driver.id
            )}
            timeSlots={timeSlots}
            selectedJob={selectedJob}
            onJobClick={onJobClick}
            onJobDoubleClick={onJobDoubleClick}
            onCreateJob={onCreateJob}
            onCreateJobWithTimeRange={onCreateJobWithTimeRange}
            onJobMove={onJobMove}
            onStatusChange={onStatusChange}
            canManageJobs={canManageJobs}
            allowOverlaps={allowOverlaps}
            sectionType={sectionType}
            isUnassigned={driver.id === 'unassigned'}
            dragSelection={dragSelection}
            onDragSelectionStart={onDragSelectionStart}
            onDragSelectionUpdate={onDragSelectionUpdate}
            onDragSelectionEnd={onDragSelectionEnd}
          />
        ))}
      </div>
    </div>
  );
}