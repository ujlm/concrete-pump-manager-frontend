'use client';

import { DashboardWidget } from './dashboard-widget';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, CheckCircle, XCircle } from 'lucide-react';

interface JobsSummaryProps {
  data: {
    total: number;
    planned: number;
    completed: number;
    cancelled: number;
  };
  isLoading?: boolean;
  error?: string;
}

export function JobsSummaryWidget({ data, isLoading, error }: JobsSummaryProps) {
  const jobStatusItems = [
    {
      label: 'Planned',
      value: data.planned,
      icon: CalendarDays,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    {
      label: 'Completed',
      value: data.completed,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    {
      label: 'Cancelled',
      value: data.cancelled,
      icon: XCircle,
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
  ];

  return (
    <DashboardWidget
      title="Today's Jobs"
      description="Job status overview for today"
      value={data.total}
      isLoading={isLoading}
      error={error}
      actions={[
        {
          label: 'View All Jobs',
          href: '/protected/jobs',
        },
        {
          label: 'Create Job',
          href: '/protected/jobs/new',
          variant: 'default',
        },
      ]}
    >
      <div className="space-y-3">
        {jobStatusItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${item.color}`}>
                <item.icon className="h-3 w-3" />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <Badge variant="outline">{item.value}</Badge>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}