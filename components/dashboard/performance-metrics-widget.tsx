'use client';

import { DashboardWidget } from './dashboard-widget';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, CheckCircle } from 'lucide-react';

interface PerformanceMetricsWidgetProps {
  data: {
    jobCompletionRate: number;
    averageEfficiency: number;
    onTimeDeliveryRate: number;
  };
  isLoading?: boolean;
  error?: string;
}

export function PerformanceMetricsWidget({ data, isLoading, error }: PerformanceMetricsWidgetProps) {
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
    return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
  };

  const getPerformanceStatus = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    return 'Needs Improvement';
  };

  const metrics = [
    {
      label: 'Job Completion Rate',
      value: data.jobCompletionRate,
      icon: CheckCircle,
      description: 'Jobs completed successfully',
    },
    {
      label: 'Average Efficiency',
      value: data.averageEfficiency,
      icon: Target,
      description: 'Overall operational efficiency',
    },
    {
      label: 'On-Time Delivery',
      value: data.onTimeDeliveryRate,
      icon: Clock,
      description: 'Deliveries made on schedule',
    },
  ];

  return (
    <DashboardWidget
      title="Performance Metrics"
      description="Key performance indicators"
      isLoading={isLoading}
      error={error}
      actions={[
        {
          label: 'Detailed Analytics',
          href: '/protected/reports/performance',
        },
        {
          label: 'Export Report',
          onClick: () => {
            console.log('Exporting performance report...');
          },
          variant: 'secondary',
        },
      ]}
      size="lg"
    >
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${getPerformanceColor(metric.value)}`}>
                  <metric.icon className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{metric.label}</div>
                  <div className="text-xs text-muted-foreground">{metric.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{metric.value.toFixed(1)}%</div>
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  {getPerformanceStatus(metric.value)}
                </Badge>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  metric.value >= 90
                    ? 'bg-green-500'
                    : metric.value >= 75
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(metric.value, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}