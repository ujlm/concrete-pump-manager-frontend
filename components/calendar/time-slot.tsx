'use client';

import React from 'react';
import { useDrop } from 'react-dnd';
import type { CalendarJob } from '@/lib/types/calendar';

interface TimeSlotProps {
  time: string;
  driverId?: string;
  jobs: CalendarJob[];
  selectedJob: CalendarJob | null;
  onJobClick: (job: CalendarJob) => void;
  onJobDoubleClick: (job: CalendarJob) => void;
  onCreateJob: (time: string, driverId?: string) => void;
  onJobMove: (jobId: string, newTime: string, newDriverId?: string) => void;
  onCreateJobWithTimeRange?: (startTime: string, endTime: string, driverId?: string) => void;
  canManageJobs: boolean;
  allowOverlaps: boolean;
  isUnassigned?: boolean;
  isDragSelecting?: boolean;
  isDragSelected?: boolean;
  onDragStart?: (time: string, driverId?: string) => void;
  onDragEnter?: (time: string, driverId?: string) => void;
  onDragEnd?: () => void;
}

export function TimeSlot({
  time,
  driverId,
  jobs,
  selectedJob,
  onJobClick,
  onJobDoubleClick,
  onCreateJob,
  onJobMove,
  onCreateJobWithTimeRange,
  canManageJobs,
  allowOverlaps,
  isUnassigned = false,
  isDragSelecting = false,
  isDragSelected = false,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: TimeSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'job',
    drop: (item: { id: string; type: string }) => ({
      time,
      driverId,
    }),
    canDrop: (item) => {
      // Allow drops if overlaps are allowed, or if no conflict exists
      if (allowOverlaps) return true;

      // Check for conflicts
      const draggedJob = jobs.find(j => j.id === item.id);
      if (!draggedJob) return true;

      // For now, allow all drops - real conflict detection would be more complex
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const hasJobs = jobs.length > 0;
  const isHourSlot = time.endsWith(':45');

  const handleDoubleClick = () => {
    if (canManageJobs && !hasJobs) {
      onCreateJob(time, driverId);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (canManageJobs && !hasJobs && onDragStart) {
      e.preventDefault();
      onDragStart(time, driverId);
    }
  };

  const handleMouseEnter = () => {
    if (isDragSelecting && onDragEnter) {
      onDragEnter(time, driverId);
    }
  };

  const handleMouseUp = () => {
    if (isDragSelecting && onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <div
      ref={drop as any}
      className={`h-8 border-b border-gray-200 relative cursor-pointer transition-colors ${
        isHourSlot ? 'border-b-2 border-gray-300' : ''
      } ${
        isDragSelected
          ? 'bg-blue-200'
          : isOver && canDrop
          ? 'bg-blue-100'
          : isOver && !canDrop
          ? 'bg-red-100'
          : hasJobs
          ? 'bg-gray-50/50'
          : 'hover:bg-gray-50'
      }`}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      title={canManageJobs && !hasJobs ? `Double-click to create job at ${time} or click and drag to select time range` : undefined}
    >
      {/* Drop indicator */}
      {isOver && canDrop && (
        <div className="absolute inset-0 border-2 border-blue-400 border-dashed bg-blue-50/50 rounded" />
      )}
      {isOver && !canDrop && (
        <div className="absolute inset-0 border-2 border-red-400 border-dashed bg-red-50/50 rounded" />
      )}

      {/* Conflict indicator for overlapping jobs */}
      {hasJobs && jobs.length > 1 && !allowOverlaps && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </div>
  );
}