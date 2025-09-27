'use client';

import React from 'react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
} from 'lucide-react';
import type { CalendarView, ZoomLevel, ConflictInfo } from '@/lib/types/calendar';

interface CalendarHeaderProps {
  selectedDate: string;
  view: CalendarView;
  zoomLevel: ZoomLevel;
  onDateChange: (date: string) => void;
  onViewChange: (view: CalendarView) => void;
  onZoomChange: (zoom: ZoomLevel) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onRefresh: () => void;
  conflicts: ConflictInfo[];
}

export function CalendarHeader({
  selectedDate,
  view,
  zoomLevel,
  onDateChange,
  onViewChange,
  onZoomChange,
  onPreviousDay,
  onNextDay,
  onToday,
  onRefresh,
  conflicts,
}: CalendarHeaderProps) {
  // Generate next 10 workdays
  const workDays = React.useMemo(() => {
    const days = [];
    const today = new Date();
    let current = today;
    let count = 0;

    while (count < 10) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        days.push({
          date: format(current, 'yyyy-MM-dd'),
          display: format(current, 'EEE d/M'),
          isToday: format(current, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
        });
        count++;
      }
      current = addDays(current, 1);
    }

    return days;
  }, []);

  const errorConflicts = conflicts.filter(c => c.severity === 'error');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4">
        {/* Left section - Date navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={onNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="border-0 bg-transparent text-sm font-medium focus:outline-none focus:ring-0"
            />
          </div>

          <div className="text-lg font-semibold text-foreground">
            {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>

        {/* Center section - Quick date navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {workDays.map((day) => (
            <Button
              key={day.date}
              variant={day.date === selectedDate ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDateChange(day.date)}
              className={day.isToday ? 'ring-2 ring-blue-500' : ''}
            >
              {day.display}
            </Button>
          ))}
        </div>

        {/* Right section - Controls and status */}
        <div className="flex items-center gap-2">
          {/* Conflicts indicator */}
          {(errorConflicts.length > 0 || warningConflicts.length > 0) && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {errorConflicts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errorConflicts.length} error{errorConflicts.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {warningConflicts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {warningConflicts.length} warning{warningConflicts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}

          <div className="h-6 w-px bg-border" />

          {/* View switcher */}
          <Select value={view} onValueChange={onViewChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned Only</SelectItem>
              <SelectItem value="assigned">Assigned Only</SelectItem>
              <SelectItem value="split">Split View</SelectItem>
            </SelectContent>
          </Select>

          {/* Zoom controls */}
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (zoomLevel === 'week') onZoomChange('day');
                else if (zoomLevel === 'day') onZoomChange('hour');
              }}
              disabled={zoomLevel === 'hour'}
              className="rounded-r-none border-r"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="px-2 text-xs font-medium min-w-[40px] text-center">
              {zoomLevel === 'hour' ? 'Hour' : zoomLevel === 'day' ? 'Day' : 'Week'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (zoomLevel === 'hour') onZoomChange('day');
                else if (zoomLevel === 'day') onZoomChange('week');
              }}
              disabled={zoomLevel === 'week'}
              className="rounded-l-none border-l"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Refresh button */}
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile quick navigation */}
      <div className="lg:hidden border-t p-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {workDays.map((day) => (
            <Button
              key={day.date}
              variant={day.date === selectedDate ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDateChange(day.date)}
              className={`flex-shrink-0 ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              {day.display}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}