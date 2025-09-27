'use client';

import React from 'react';
import { useDrop } from 'react-dnd';
import { JobCard } from './job-card';
import { TimeSlot } from './time-slot';
import type { CalendarJob, Driver } from '@/lib/types/calendar';
import { TIME_SLOT_MINUTES, WORK_DAY_START, PX_PER_TIME_SLOT } from '@/lib/types/calendar';

interface DriverColumnProps {
  driver: Driver;
  jobs: CalendarJob[];
  timeSlots: { time: string; displayTime: string }[];
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
  isUnassigned?: boolean;
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

export function DriverColumn({
  driver,
  jobs,
  timeSlots,
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
  isUnassigned = false,
  dragSelection,
  onDragSelectionStart,
  onDragSelectionUpdate,
  onDragSelectionEnd,
}: DriverColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'job',
    drop: (item, monitor) => ({
      driverId: isUnassigned ? undefined : driver.id,
      time: '06:00', // Default time, will be overridden by specific time slot
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const driverName = isUnassigned
    ? 'Unassigned'
    : `${driver.first_name} ${driver.last_name}`.trim();

  // Helper function to check if a time slot is within the drag selection range
  const isTimeInDragSelection = (time: string): boolean => {
    if (!dragSelection?.showHighlight || !dragSelection.startTime || !dragSelection.endTime) {
      return false;
    }
    
    // Only apply to the same driver
    const currentDriverId = isUnassigned ? undefined : driver.id;
    if (dragSelection.driverId !== currentDriverId) {
      return false;
    }
    
    const currentTime = time;
    const startTime = dragSelection.startTime;
    const endTime = dragSelection.endTime;
    
    // Ensure proper ordering
    const actualStartTime = startTime <= endTime ? startTime : endTime;
    const actualEndTime = startTime <= endTime ? endTime : startTime;
    
    return currentTime >= actualStartTime && currentTime <= actualEndTime;
  };

  return (
    <div
      ref={drop as any}
      className={`flex-shrink-0 w-48 sm:w-60 border-r bg-background relative ${
        isOver ? 'bg-blue-50' : ''
      }`}
    >
      {/* Time slots - no header, starts immediately */}
      <div className="relative">
        {timeSlots.map((timeSlot, index) => {
          const slotsJobsAtTime = jobs.filter(job => {
            const jobStartMinutes = job.startMinutes;
            const jobEndMinutes = job.endMinutes;
            const slotMinutes = parseInt(timeSlot.time.split(':')[0]) * 60 + parseInt(timeSlot.time.split(':')[1]);

            return jobStartMinutes <= slotMinutes && slotMinutes < jobEndMinutes;
          });

          return (
            <TimeSlot
              key={`${driver.id}-${timeSlot.time}`}
              time={timeSlot.time}
              driverId={isUnassigned ? undefined : driver.id}
              jobs={slotsJobsAtTime}
              selectedJob={selectedJob}
              onJobClick={onJobClick}
              onJobDoubleClick={onJobDoubleClick}
              onCreateJob={onCreateJob}
              onCreateJobWithTimeRange={onCreateJobWithTimeRange}
              onJobMove={onJobMove}
              canManageJobs={canManageJobs}
              allowOverlaps={allowOverlaps}
              isUnassigned={isUnassigned}
              isDragSelecting={dragSelection?.isActive && dragSelection?.driverId === (isUnassigned ? undefined : driver.id)}
              isDragSelected={isTimeInDragSelection(timeSlot.time)}
              onDragStart={onDragSelectionStart}
              onDragEnter={onDragSelectionUpdate}
              onDragEnd={onDragSelectionEnd}
            />
          );
        })}

        {/* Overlay jobs positioned absolutely */}
        <div className="absolute inset-0 pointer-events-none">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="absolute left-1 right-1 pointer-events-auto"
              style={{
                // Align job positioning with shared constants and header spacer height (h-12 = 48px)
                top: `${((job.startMinutes - (WORK_DAY_START * 60)) / TIME_SLOT_MINUTES) * PX_PER_TIME_SLOT}px`,
                height: `${(job.durationMinutes / TIME_SLOT_MINUTES) * PX_PER_TIME_SLOT}px`,
                zIndex: selectedJob?.id === job.id ? 30 : 10,
              }}
            >
              <JobCard
                job={job}
                isSelected={selectedJob?.id === job.id}
                onClick={onJobClick}
                onDoubleClick={onJobDoubleClick}
                onStatusChange={onStatusChange}
                canManageJobs={canManageJobs}
                allowOverlaps={allowOverlaps}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}