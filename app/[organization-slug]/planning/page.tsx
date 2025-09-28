'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/dashboard';
import { getJobsForDate, getActiveDrivers } from '@/lib/actions/calendar';
import { CalendarLayout } from '@/components/calendar/calendar-layout';
import { CalendarView } from '@/components/calendar/calendar-view';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { CalendarView as CalendarViewType, ZoomLevel, ConflictInfo, Job, Driver } from '@/lib/types/calendar';
import type { User } from '@/lib/types/database';

export default function PlanningPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const organizationSlug = params['organization-slug'] as string;
  const date = searchParams.get('date');
  const view = searchParams.get('view');

  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarHandlers, setCalendarHandlers] = useState<{
    selectedDate: string;
    view: CalendarViewType;
    zoomLevel: ZoomLevel;
    conflicts: ConflictInfo[];
    onDateChange: (date: string) => void;
    onViewChange: (view: CalendarViewType) => void;
    onZoomChange: (zoom: ZoomLevel) => void;
    onPreviousDay: () => void;
    onNextDay: () => void;
    onToday: () => void;
    onRefresh: () => void;
  } | null>(null);

  // Default values
  const selectedDate = date || format(new Date(), 'yyyy-MM-dd');
  const calendarView = (view as CalendarViewType) || 'split';

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          window.location.href = '/auth/login';
          return;
        }

        // Check permissions
        if (!currentUser.roles.some(role => ['dispatcher', 'manager', 'organization_admin', 'driver'].includes(role))) {
          window.location.href = `/${organizationSlug}`;
          return;
        }

        const [jobsData, driversData] = await Promise.all([
          getJobsForDate(organizationSlug, selectedDate),
          getActiveDrivers(organizationSlug),
        ]);

        setUser(currentUser);
        setJobs(jobsData);
        setDrivers(driversData);
      } catch (error) {
        console.error('Error loading planning data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [organizationSlug, selectedDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <CalendarLayout
      user={user}
      selectedDate={calendarHandlers?.selectedDate || selectedDate}
      view={calendarHandlers?.view || calendarView}
      zoomLevel={calendarHandlers?.zoomLevel || 'day'}
      onDateChange={calendarHandlers?.onDateChange || (() => {})}
      onViewChange={calendarHandlers?.onViewChange || (() => {})}
      onZoomChange={calendarHandlers?.onZoomChange || (() => {})}
      onPreviousDay={calendarHandlers?.onPreviousDay || (() => {})}
      onNextDay={calendarHandlers?.onNextDay || (() => {})}
      onToday={calendarHandlers?.onToday || (() => {})}
      onRefresh={calendarHandlers?.onRefresh || (() => {})}
      conflicts={calendarHandlers?.conflicts || []}
    >
      <CalendarView
        organizationSlug={organizationSlug}
        initialJobs={jobs}
        drivers={drivers}
        selectedDate={selectedDate}
        initialView={calendarView}
        currentUser={user}
        exposeHandlers={setCalendarHandlers}
      />
    </CalendarLayout>
  );
}