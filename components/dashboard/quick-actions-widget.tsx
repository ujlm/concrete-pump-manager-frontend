'use client';

import Link from 'next/link';
import { DashboardWidget } from './dashboard-widget';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Calendar,
  Users,
  Truck,
  FileText,
  Settings,
  Search,
  Clock
} from 'lucide-react';

interface QuickActionsWidgetProps {
  userRoles: string[];
}

export function QuickActionsWidget({ userRoles }: QuickActionsWidgetProps) {
  const hasRole = (requiredRoles: string[]) => {
    return userRoles.some(role => requiredRoles.includes(role));
  };

  const quickActions = [
    {
      label: 'Create Job',
      href: '/protected/jobs/new',
      icon: Plus,
      description: 'Schedule a new concrete pumping job',
      variant: 'default' as const,
      roles: ['dispatcher', 'manager', 'organization_admin'],
    },
    {
      label: 'View Calendar',
      href: '/protected/planning',
      icon: Calendar,
      description: 'Check job schedule and planning',
      variant: 'secondary' as const,
      roles: ['dispatcher', 'manager', 'organization_admin'],
    },
    {
      label: 'Manage Clients',
      href: '/protected/clients',
      icon: Users,
      description: 'Add or update client information',
      variant: 'outline' as const,
      roles: ['dispatcher', 'manager', 'organization_admin'],
    },
    {
      label: 'Fleet Status',
      href: '/protected/machines',
      icon: Truck,
      description: 'Check pump and equipment status',
      variant: 'outline' as const,
      roles: ['dispatcher', 'manager', 'organization_admin'],
    },
    {
      label: 'Generate Report',
      href: '/protected/reports',
      icon: FileText,
      description: 'Create financial and operational reports',
      variant: 'outline' as const,
      roles: ['accountant', 'manager', 'organization_admin'],
    },
    {
      label: 'System Settings',
      href: '/protected/settings',
      icon: Settings,
      description: 'Configure system preferences',
      variant: 'ghost' as const,
      roles: ['manager', 'organization_admin'],
    },
  ];

  const availableActions = quickActions.filter(action => hasRole(action.roles));

  // Special actions for driver role
  const driverActions = [
    {
      label: 'My Jobs Today',
      href: '/protected/jobs?filter=assigned',
      icon: Clock,
      description: 'View your assigned jobs for today',
      variant: 'default' as const,
    },
    {
      label: 'Update Job Status',
      href: '/protected/jobs?action=update',
      icon: FileText,
      description: 'Update status of current jobs',
      variant: 'secondary' as const,
    },
  ];

  const actionsToShow = userRoles.includes('driver') && !hasRole(['dispatcher', 'manager', 'organization_admin'])
    ? driverActions
    : availableActions.slice(0, 6); // Show max 6 actions

  return (
    <DashboardWidget
      title="Quick Actions"
      description="Common tasks and shortcuts"
      size="lg"
    >
      <div className="grid grid-cols-2 gap-3">
        {actionsToShow.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            className="h-auto p-3 flex flex-col items-start gap-2 text-left"
            asChild
          >
            <Link href={action.href}>
              <div className="flex items-center gap-2 w-full">
                <action.icon className="h-4 w-4 shrink-0" />
                <span className="font-medium text-sm truncate">{action.label}</span>
              </div>
              <span className="text-xs text-muted-foreground line-clamp-2 w-full">
                {action.description}
              </span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Global search action */}
      <div className="mt-4 p-3 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Quick Search</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Use the search bar in the header to find jobs, clients, or equipment quickly
        </p>
      </div>
    </DashboardWidget>
  );
}