'use client';

import { DashboardWidget } from './dashboard-widget';
import { Badge } from '@/components/ui/badge';
import { Truck, Activity, Clock, MapPin } from 'lucide-react';

interface ActivePumpsWidgetProps {
  count: number;
  pumps?: Array<{
    id: string;
    name: string;
    status: 'active' | 'idle' | 'maintenance';
    location?: string;
    pompist?: {
      first_name: string;
      last_name: string;
    };
  }>;
  isLoading?: boolean;
  error?: string;
}

export function ActivePumpsWidget({ count, pumps = [], isLoading, error }: ActivePumpsWidgetProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'maintenance':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return Activity;
      case 'idle':
        return Clock;
      case 'maintenance':
        return Truck;
      default:
        return Truck;
    }
  };

  return (
    <DashboardWidget
      title="Active Pumps"
      description="Current pump status and location"
      value={count}
      isLoading={isLoading}
      error={error}
      actions={[
        {
          label: 'Manage Pumps',
          href: '/protected/machines',
        },
        {
          label: 'Add Pump',
          href: '/protected/machines/new',
          variant: 'default',
        },
      ]}
      size="lg"
    >
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {pumps.length > 0 ? (
          pumps.slice(0, 4).map((pump) => {
            const StatusIcon = getStatusIcon(pump.status);
            return (
              <div key={pump.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`p-1 rounded ${getStatusColor(pump.status)}`}>
                    <StatusIcon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{pump.name}</div>
                    {pump.pompist && (
                      <div className="text-xs text-muted-foreground truncate">
                        {pump.pompist.first_name} {pump.pompist.last_name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {pump.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-20">{pump.location}</span>
                    </div>
                  )}
                  <Badge
                    variant="outline"
                    className="text-xs capitalize ml-1"
                  >
                    {pump.status}
                  </Badge>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active pumps at the moment</p>
          </div>
        )}
      </div>

      {pumps.length > 4 && (
        <div className="mt-3 text-center">
          <Badge variant="secondary" className="text-xs">
            +{pumps.length - 4} more pumps
          </Badge>
        </div>
      )}
    </DashboardWidget>
  );
}