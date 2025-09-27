'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  Truck,
  DollarSign,
  UserCheck,
  Settings,
  FileText,
  ShieldCheck
} from 'lucide-react';

interface SettingsSidebarProps {
  organizationSlug: string;
  userRoles: string[];
  className?: string;
}

interface SettingsNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  roles?: string[];
}

export function SettingsSidebar({ organizationSlug, userRoles, className }: SettingsSidebarProps) {
  const pathname = usePathname();

  const hasRole = (requiredRoles?: string[]) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return userRoles.some(role => requiredRoles.includes(role));
  };

  const settingsNavItems: SettingsNavItem[] = [
    {
      name: 'Organization',
      href: `/${organizationSlug}/settings/organization`,
      icon: Building2,
      description: 'Organization details, branding, and subscription',
      roles: ['manager', 'organization_admin'],
    },
    {
      name: 'User Management',
      href: `/${organizationSlug}/settings/users`,
      icon: Users,
      description: 'Manage users, roles, and permissions',
      roles: ['manager', 'organization_admin'],
    },
    {
      name: 'Pump Types',
      href: `/${organizationSlug}/settings/pump-types`,
      icon: Truck,
      description: 'Configure available pump types and capacities',
      roles: ['dispatcher', 'manager', 'organization_admin'],
    },
    {
      name: 'Price Lists',
      href: `/${organizationSlug}/settings/prices`,
      icon: DollarSign,
      description: 'Pricing configurations and surcharges',
      roles: ['accountant', 'manager', 'organization_admin'],
    },
    {
      name: 'Clients',
      href: `/${organizationSlug}/settings/clients`,
      icon: UserCheck,
      description: 'Client directory and custom pricing',
      roles: ['dispatcher', 'manager', 'organization_admin'],
    },
    {
      name: 'Machines',
      href: `/${organizationSlug}/settings/machines`,
      icon: Settings,
      description: 'Pump and equipment management',
      roles: ['dispatcher', 'manager', 'organization_admin'],
    },
    {
      name: 'Invoice Templates',
      href: `/${organizationSlug}/settings/invoicing`,
      icon: FileText,
      description: 'Custom invoice templates and fields',
      roles: ['accountant', 'manager', 'organization_admin'],
    },
  ];

  const availableNavItems = settingsNavItems.filter(item => hasRole(item.roles));

  return (
    <div className={cn('w-64 bg-card border-r min-h-screen', className)}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Settings
        </h2>

        <nav className="space-y-1">
          {availableNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-start gap-3 px-3 py-3 text-sm rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground mt-1 leading-tight">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}