'use client';

import { useState } from 'react';
import { NavigationSidebar } from '@/components/dashboard/navigation-sidebar';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types/database';
import { CalendarHeader } from './calendar-header';
import type { CalendarView, ZoomLevel, ConflictInfo } from '@/lib/types/calendar';

interface CalendarLayoutProps {
  children: React.ReactNode;
  user: User;
  className?: string;
  // Calendar header props
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

export function CalendarLayout({
  children,
  user,
  className,
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
}: CalendarLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <NavigationSidebar
          user={{
            first_name: user.first_name,
            last_name: user.last_name,
            roles: user.roles,
            organization: user.organization,
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Calendar Header - replaces the dashboard header */}
        <CalendarHeader
          selectedDate={selectedDate}
          view={view}
          zoomLevel={zoomLevel}
          onDateChange={onDateChange}
          onViewChange={onViewChange}
          onZoomChange={onZoomChange}
          onPreviousDay={onPreviousDay}
          onNextDay={onNextDay}
          onToday={onToday}
          onRefresh={onRefresh}
          conflicts={conflicts}
        />

        {/* Page content */}
        <main className={cn('flex-1 overflow-hidden', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
