'use client';

import { DashboardWidget } from './dashboard-widget';
import { Badge } from '@/components/ui/badge';
import { Euro, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface RevenueWidgetProps {
  data: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  isLoading?: boolean;
  error?: string;
}

export function RevenueWidget({ data, isLoading, error }: RevenueWidgetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const revenueItems = [
    {
      label: 'Today',
      value: data.today,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'This Week',
      value: data.thisWeek,
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      label: 'This Month',
      value: data.thisMonth,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <DashboardWidget
      title="Revenue Overview"
      description="Financial performance tracking"
      value={formatCurrency(data.thisMonth)}
      isLoading={isLoading}
      error={error}
      trend="up"
      actions={[
        {
          label: 'View Reports',
          href: '/protected/reports',
        },
        {
          label: 'Export Data',
          onClick: () => {
            // Implement export functionality
            console.log('Exporting revenue data...');
          },
          variant: 'secondary',
        },
      ]}
    >
      <div className="space-y-3">
        {revenueItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{formatCurrency(item.value)}</div>
            </div>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}