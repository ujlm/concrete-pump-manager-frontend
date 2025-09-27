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
  canManageJobs: boolean;
  allowOverlaps: boolean;
  isUnassigned?: boolean;
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
  canManageJobs,
  allowOverlaps,
  isUnassigned = false,
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

  return (
    <div
      ref={drop as any}
      className={`h-8 border-b border-gray-200 relative cursor-pointer transition-colors ${
        isHourSlot ? 'border-b-2 border-gray-300' : ''
      } ${
        isOver && canDrop
          ? 'bg-blue-100'
          : isOver && !canDrop
          ? 'bg-red-100'
          : hasJobs
          ? 'bg-gray-50/50'
          : 'hover:bg-gray-50'
      }`}
      onDoubleClick={handleDoubleClick}
      title={canManageJobs && !hasJobs ? `Double-click to create job at ${time}` : undefined}
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