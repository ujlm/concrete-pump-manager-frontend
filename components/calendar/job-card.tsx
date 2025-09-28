'use client';

import React, { useState, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { getStatusColor, getStatusLabel, minutesToTime, timeToMinutes, calculateDepartureTime, TIME_SLOT_MINUTES, PX_PER_TIME_SLOT } from '@/lib/types/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  MapPin,
  Clock,
  User,
  Building2,
  Truck,
} from 'lucide-react';
import type { CalendarJob } from '@/lib/types/calendar';

interface JobCardProps {
  job: CalendarJob;
  isSelected: boolean;
  onClick: (job: CalendarJob) => void;
  onDoubleClick: (job: CalendarJob) => void;
  onStatusChange: (jobId: string, newStatus: CalendarJob['job_status']) => void;
  onJobResize?: (jobId: string, newStartTime?: string, newEndTime?: string) => void;
  canManageJobs: boolean;
  allowOverlaps?: boolean;
}

export function JobCard({
  job,
  isSelected,
  onClick,
  onDoubleClick,
  onStatusChange,
  onJobResize,
  canManageJobs,
}: JobCardProps) {
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [originalStartTime, setOriginalStartTime] = useState('');
  const [originalEndTime, setOriginalEndTime] = useState('');
  const [previewStartTime, setPreviewStartTime] = useState<string | null>(null);
  const [previewEndTime, setPreviewEndTime] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Use refs to persist resize state across re-renders
  const isResizingRef = useRef<'top' | 'bottom' | null>(null);
  const resizeStartYRef = useRef(0);
  const originalStartTimeRef = useRef('');
  const originalEndTimeRef = useRef('');
  
  // Track final resize values to save only once
  const finalResizeTimeRef = useRef<{ start?: string; end?: string } | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'job',
    item: () => {
      console.log('🎯 Starting to drag job:', {
        jobId: job.id,
        canManageJobs,
        isResizing
      });
      return { id: job.id, type: 'job' };
    },
    canDrag: canManageJobs && !isResizing,
    end: (item, monitor) => {
      console.log('🏁 Drag ended:', {
        jobId: job.id,
        didDrop: monitor.didDrop(),
        dropResult: monitor.getDropResult()
      });
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const statusColor = getStatusColor(job.status || 'planning');
  const statusLabel = getStatusLabel(job.status || 'planning');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(job);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(job);
  };

  const handleResizeStart = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    console.log('🔧 Resize start:', { 
      direction, 
      canManageJobs, 
      hasOnJobResize: !!onJobResize,
      jobId: job.id,
      currentStartTime: job.start_time,
      currentEndTime: job.end_time,
      travelTime: job.travel_time_minutes
    });
    
    if (!canManageJobs || !onJobResize) {
      console.log('❌ Cannot resize - missing permissions or handler');
      return;
    }
    
    // Set both state and ref to handle re-renders
    setIsResizing(direction);
    isResizingRef.current = direction;
    
    setResizeStartY(e.clientY);
    resizeStartYRef.current = e.clientY;
    
    const departureTime = calculateDepartureTime(job.start_time, job.travel_time_minutes);
    const originalStart = departureTime || job.start_time || '';
    const originalEnd = job.end_time || '';
    
    setOriginalStartTime(originalStart);
    originalStartTimeRef.current = originalStart;
    setOriginalEndTime(originalEnd);
    originalEndTimeRef.current = originalEnd;
    
    // Clear any previous preview times
    setPreviewStartTime(null);
    setPreviewEndTime(null);
    finalResizeTimeRef.current = null;
    
    console.log('🎯 Resize setup:', {
      direction,
      startY: e.clientY,
      departureTime,
      originalStart,
      originalEnd,
      isResizing: direction
    });
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    // Use refs to get current values (persists across re-renders)
    const currentIsResizing = isResizingRef.current;
    const currentResizeStartY = resizeStartYRef.current;
    const currentOriginalStartTime = originalStartTimeRef.current;
    const currentOriginalEndTime = originalEndTimeRef.current;
    
    if (!currentIsResizing || !onJobResize) {
      console.log('❌ Resize move blocked:', { 
        currentIsResizing, 
        stateIsResizing: isResizing,
        hasOnJobResize: !!onJobResize 
      });
      return;
    }
    
    const deltaY = e.clientY - currentResizeStartY;
    const deltaMinutes = Math.round(deltaY / (PX_PER_TIME_SLOT / TIME_SLOT_MINUTES)) * TIME_SLOT_MINUTES;
    
    console.log('📐 Resize move:', { 
      currentIsResizing, 
      deltaY, 
      deltaMinutes,
      currentY: e.clientY,
      startY: currentResizeStartY,
      PX_PER_TIME_SLOT,
      TIME_SLOT_MINUTES,
      originalStartTime: currentOriginalStartTime,
      originalEndTime: currentOriginalEndTime
    });
    
    if (currentIsResizing === 'top') {
      // Resize from top (adjust start time)
      const currentStartMinutes = timeToMinutes(currentOriginalStartTime);
      const newStartMinutes = Math.max(0, currentStartMinutes + deltaMinutes);
      const newStartTime = minutesToTime(newStartMinutes);
      
      // Don't allow start time to go past end time
      const endMinutes = timeToMinutes(currentOriginalEndTime);
      
      console.log('🔝 Resizing top:', {
        currentStartMinutes,
        deltaMinutes,
        newStartMinutes,
        newStartTime,
        endMinutes,
        canResize: newStartMinutes < endMinutes
      });
      
      if (newStartMinutes < endMinutes) {
        console.log('✅ Setting preview start time:', { jobId: job.id, newStartTime });
        setPreviewStartTime(newStartTime);
        finalResizeTimeRef.current = { start: newStartTime, end: undefined };
      } else {
        console.log('❌ Cannot resize top - would go past end time');
      }
    } else if (currentIsResizing === 'bottom') {
      // Resize from bottom (adjust end time)
      const currentEndMinutes = timeToMinutes(currentOriginalEndTime);
      const newEndMinutes = currentEndMinutes + deltaMinutes;
      const newEndTime = minutesToTime(newEndMinutes);
      
      // Don't allow end time to go before start time
      const startMinutes = timeToMinutes(currentOriginalStartTime);
      
      console.log('🔻 Resizing bottom:', {
        currentEndMinutes,
        deltaMinutes,
        newEndMinutes,
        newEndTime,
        startMinutes,
        canResize: newEndMinutes > startMinutes
      });
      
      if (newEndMinutes > startMinutes) {
        console.log('✅ Setting preview end time:', { jobId: job.id, newEndTime });
        setPreviewEndTime(newEndTime);
        finalResizeTimeRef.current = { start: undefined, end: newEndTime };
      } else {
        console.log('❌ Cannot resize bottom - would go before start time');
      }
    }
  };

  const handleResizeEnd = () => {
    const finalTimes = finalResizeTimeRef.current;
    
    console.log('🏁 Resize end:', { 
      wasResizing: isResizing,
      wasResizingRef: isResizingRef.current,
      finalTimes,
      jobId: job.id 
    });
    
    // Save the final resize if there were changes
    if (finalTimes && onJobResize && (finalTimes.start || finalTimes.end)) {
      console.log('💾 Saving final resize:', finalTimes);
      onJobResize(job.id, finalTimes.start, finalTimes.end);
    }
    
    // Clear all resize state
    setIsResizing(null);
    isResizingRef.current = null;
    setPreviewStartTime(null);
    setPreviewEndTime(null);
    finalResizeTimeRef.current = null;
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const getTimeDisplay = () => {
    // Use preview times during resize, otherwise use job times
    const startTime = previewStartTime || job.start_time;
    const endTime = previewEndTime || job.end_time;

    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    } else if (startTime) {
      return `${startTime}`;
    }
    return 'No time set';
  };


  // Calculate travel time percentage for positioning
  const travelTimePercentage = job.travel_time_minutes && job.durationMinutes > 0 
    ? Math.min(100, (job.travel_time_minutes / job.durationMinutes) * 100)
    : 0;

  return (
    <div
      ref={(el) => {
        cardRef.current = el;
        drag(el);
      }}
      className={`
        relative rounded-lg border-2 cursor-pointer transition-all duration-200
        ${statusColor}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
        ${canManageJobs && !isResizing ? 'cursor-grab' : 'cursor-pointer'}
        min-h-[50px] sm:min-h-[60px] w-full text-xs sm:text-sm
        h-full overflow-hidden
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* Job content positioned after travel time */}
      <div 
        className="absolute inset-x-0 p-1.5 sm:p-2"
        style={{
          top: `${travelTimePercentage}%`,
          height: `${100 - travelTimePercentage}%`
        }}
      >
        {/* Status badge */}
        <div className="flex items-center justify-between mb-1">
          <Badge variant="outline" className="text-xs px-1 py-0">
            {statusLabel}
          </Badge>

          {canManageJobs && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onDoubleClick(job)}>
                  Edit job
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange(job.id, 'received')}>
                  Mark as received
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(job.id, 'in_progress')}>
                  Mark as in progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(job.id, 'completed')}>
                  Mark as completed
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onStatusChange(job.id, 'cancelled')}
                  className="text-red-600"
                >
                  Cancel job
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Job details */}
        <div className="space-y-1">
          {/* Client name */}
          {job.client && (
            <div className="flex items-center gap-1 font-medium truncate">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{job.client.name}</span>
            </div>
          )}

          {/* Time */}
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{getTimeDisplay()}</span>
          </div>

          {/* Location */}
          {job.address_city && (
            <div className="flex items-center gap-1 text-gray-600 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {job.address_city}
                <span className="hidden sm:inline">
                  {job.address_postal_code && ` (${job.address_postal_code})`}
                </span>
              </span>
            </div>
          )}

          {/* Pumpist */}
          {job.pumpist && (
            <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {job.pumpist.first_name} {job.pumpist.last_name}
              </span>
            </div>
          )}

          {/* Pump type and volume */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            {job.pump_type && (
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{job.pump_type.name}</span>
              </div>
            )}

            {job.volume_m3 && (
              <span className="text-xs font-medium">
                {job.volume_m3}m³
              </span>
            )}
          </div>

          {/* Contact info */}
          {job.client?.phone && (
            <div className="text-gray-500 truncate hidden sm:block">
              Contact: {job.client.phone}
            </div>
          )}

          {/* Notes preview */}
          {job.notes && (
            <div className="text-gray-500 italic truncate hidden sm:block">
              &ldquo;{job.notes}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Travel time visual overlay */}
      {job.travel_time_minutes && job.travel_time_minutes > 0 && (
        <div
          className="absolute left-0 top-0 right-0 bg-orange-200/60 border-b-2 border-orange-400"
          style={{
            height: `${travelTimePercentage}%`
          }}
          title={`Travel time: ${job.travel_time_minutes} minutes`}
        >
          <div className="absolute top-1 right-1 text-xs font-medium text-orange-800">
            🚛 Travel: {job.travel_time_minutes}m
          </div>
        </div>
      )}

      {/* Resize handles */}
      {canManageJobs && onJobResize && !isDragging ? (
        <>
          {console.log('🎛️ Rendering resize handles for job:', job.id)}
          {/* Top resize handle */}
          <div
            className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize bg-blue-200/30 hover:bg-blue-200/70 transition-colors border-t border-blue-300"
            onMouseDown={(e) => {
              console.log('🔝 Top handle mouseDown triggered');
              handleResizeStart(e, 'top');
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔝 Top handle clicked!');
            }}
            onMouseEnter={() => console.log('🔝 Top handle hover')}
            title="Drag to adjust start time"
          >
            <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
          </div>
          
          {/* Bottom resize handle */}
          <div
            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize bg-blue-200/30 hover:bg-blue-200/70 transition-colors border-b border-blue-300"
            onMouseDown={(e) => {
              console.log('🔻 Bottom handle mouseDown triggered');
              handleResizeStart(e, 'bottom');
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔻 Bottom handle clicked!');
            }}
            onMouseEnter={() => console.log('🔻 Bottom handle hover')}
            title="Drag to adjust end time"
          >
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
          </div>
        </>
      ) : (
        console.log('❌ Resize handles NOT rendered:', {
          canManageJobs,
          hasOnJobResize: !!onJobResize,
          isDragging,
          jobId: job.id
        })
      )}

      {/* Drag handle indicator */}
      {canManageJobs && !isDragging && !isResizing && (
        <div className="absolute top-1 left-1 opacity-20 hover:opacity-60">
          <div className="w-1 h-4 bg-current rounded-full" />
        </div>
      )}
    </div>
  );
}