'use client';

import { DashboardWidget } from './dashboard-widget';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Building } from 'lucide-react';
import { format } from 'date-fns';
import { Job } from '@/lib/types/database';
import { calculateDepartureTime } from '@/lib/types/calendar';

interface UpcomingJobsWidgetProps {
  jobs: Job[];
  isLoading?: boolean;
  error?: string;
}

export function UpcomingJobsWidget({ jobs, isLoading, error }: UpcomingJobsWidgetProps) {
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: format(date, 'MMM dd'),
      time: format(date, 'HH:mm'),
    };
  };

  return (
    <DashboardWidget
      title="Upcoming Jobs"
      description="Next scheduled concrete pumping jobs"
      value={jobs.length}
      isLoading={isLoading}
      error={error}
      actions={[
        {
          label: 'View Schedule',
          href: '/protected/planning',
        },
        {
          label: 'Create Job',
          href: '/protected/jobs/new',
          variant: 'default',
        },
      ]}
      size="lg"
    >
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {jobs.length > 0 ? (
          jobs.map((job) => {
            const departureTime = calculateDepartureTime(job.start_time, job.travel_time_minutes);
            const { date, time } = formatDateTime(departureTime || job.start_time);
            return (
              <div key={job.id} className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">{date}</span>
                      <span className="text-xs font-semibold">{time}</span>
                    </div>

                    <div className="space-y-1">
                      {job.client && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium truncate">{job.client.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {job.address.city}, {job.address.street}
                        </span>
                      </div>

                      {job.assigned_driver && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {job.assigned_driver.first_name} {job.assigned_driver.last_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant={job.status === 'planned' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {job.status === 'planned' ? 'Planned' :
                       job.status === 'planned_own_concrete' ? 'Own Concrete' :
                       job.status === 'to_plan' ? 'To Plan' : 'Cancelled'}
                    </Badge>

                    {job.volume_m3 && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {job.volume_m3}m³
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming jobs scheduled</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
}