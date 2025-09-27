'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { getStatusColor, getStatusLabel } from '@/lib/types/calendar';
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
  Phone,
} from 'lucide-react';
import type { CalendarJob } from '@/lib/types/calendar';

interface JobCardProps {
  job: CalendarJob;
  isSelected: boolean;
  onClick: (job: CalendarJob) => void;
  onDoubleClick: (job: CalendarJob) => void;
  onStatusChange: (jobId: string, newStatus: CalendarJob['status']) => void;
  canManageJobs: boolean;
  allowOverlaps: boolean;
}

export function JobCard({
  job,
  isSelected,
  onClick,
  onDoubleClick,
  onStatusChange,
  canManageJobs,
  allowOverlaps,
}: JobCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'job',
    item: { id: job.id, type: 'job' },
    canDrag: canManageJobs,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const statusColor = getStatusColor(job.status);
  const statusLabel = getStatusLabel(job.status);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(job);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(job);
  };

  const getTimeDisplay = () => {
    const startTime = job.departure_time || job.start_time;
    const endTime = job.end_time;

    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    } else if (startTime) {
      return `${startTime}`;
    }
    return 'No time set';
  };

  const getTravelIndicator = () => {
    if (job.travel_time_minutes && job.travel_time_minutes > 0) {
      return (
        <div className="text-xs text-orange-600 bg-orange-100 px-1 rounded">
          Travel: {job.travel_time_minutes}m
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={drag as any}
      className={`
        relative p-1.5 sm:p-2 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${statusColor}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
        ${canManageJobs ? 'cursor-grab' : 'cursor-pointer'}
        min-h-[50px] sm:min-h-[60px] w-full text-xs sm:text-sm
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        opacity: isDragging ? 0.5 : 1,
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
              <DropdownMenuItem onClick={() => onStatusChange(job.id, 'planned')}>
                Mark as planned
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(job.id, 'en_route')}>
                Mark en route
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(job.id, 'completed')}>
                Mark completed
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

        {/* Travel time indicator */}
        {getTravelIndicator()}

        {/* Contact info */}
        {job.client?.contact_person && (
          <div className="text-gray-500 truncate hidden sm:block">
            Contact: {job.client.contact_person}
            {job.client.phone && (
              <span className="ml-1">({job.client.phone})</span>
            )}
          </div>
        )}

        {/* Notes preview */}
        {job.notes && (
          <div className="text-gray-500 italic truncate hidden sm:block">
            "{job.notes}"
          </div>
        )}
      </div>

      {/* Travel time visual indicator */}
      {job.travel_time_minutes && job.travel_time_minutes > 0 && (
        <div
          className="absolute left-0 top-0 w-1 bg-orange-400 rounded-l-lg"
          style={{
            height: `${Math.min(100, (job.travel_time_minutes / job.durationMinutes) * 100)}%`
          }}
          title={`Travel time: ${job.travel_time_minutes} minutes`}
        />
      )}

      {/* Drag handle indicator */}
      {canManageJobs && !isDragging && (
        <div className="absolute top-1 left-1 opacity-20 hover:opacity-60">
          <div className="w-1 h-4 bg-current rounded-full" />
        </div>
      )}
    </div>
  );
}