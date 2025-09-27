'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  Users,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  roles?: string[];
  children?: NavigationItem[];
}

const getNavigationItems = (organizationSlug: string): NavigationItem[] => [
  {
    name: 'Dashboard',
    href: `/${organizationSlug}/dashboard`,
    icon: LayoutDashboard,
    description: 'Overview and statistics',
  },
  {
    name: 'Planning',
    href: `/${organizationSlug}/planning`,
    icon: Calendar,
    description: 'Job scheduling and calendar',
    roles: ['dispatcher', 'manager', 'organization_admin'],
  },
  {
    name: 'Jobs',
    href: `/${organizationSlug}/jobs`,
    icon: Briefcase,
    description: 'Manage jobs and assignments',
  },
  {
    name: 'Clients',
    href: `/${organizationSlug}/settings/clients`,
    icon: Users,
    description: 'Client management',
    roles: ['dispatcher', 'manager', 'organization_admin'],
  },
  {
    name: 'Machines',
    href: `/${organizationSlug}/settings/pump-types`,
    icon: Truck,
    description: 'Pump and equipment management',
    roles: ['dispatcher', 'manager', 'organization_admin'],
  },
  {
    name: 'Reports',
    href: `/${organizationSlug}/reports`,
    icon: BarChart3,
    description: 'Analytics and reporting',
    roles: ['accountant', 'manager', 'organization_admin'],
  },
  {
    name: 'Settings',
    icon: Settings,
    description: 'System configuration',
    roles: ['manager', 'organization_admin'],
    children: [
      {
        name: 'Organization',
        href: `/${organizationSlug}/settings/organization`,
        icon: Building2,
        description: 'Organization details and branding',
        roles: ['manager', 'organization_admin'],
      },
      {
        name: 'User Management',
        href: `/${organizationSlug}/settings/users`,
        icon: Users,
        description: 'Manage users and permissions',
        roles: ['manager', 'organization_admin'],
      },
      {
        name: 'Pump Types',
        href: `/${organizationSlug}/settings/pump-types`,
        icon: Truck,
        description: 'Configure pump types and capacities',
        roles: ['dispatcher', 'manager', 'organization_admin'],
      },
      {
        name: 'Price Lists',
        href: `/${organizationSlug}/settings/price-lists`,
        icon: BarChart3,
        description: 'Pricing configurations',
        roles: ['accountant', 'manager', 'organization_admin'],
      },
      {
        name: 'Clients',
        href: `/${organizationSlug}/settings/clients`,
        icon: Users,
        description: 'Client directory and pricing',
        roles: ['dispatcher', 'manager', 'organization_admin'],
      },
    ],
  },
];

interface NavigationSidebarProps {
  user: {
    first_name: string;
    last_name: string;
    roles: string[];
    organization?: {
      name: string;
      slug: string;
      logo_url?: string;
    };
  };
  className?: string;
}

export function NavigationSidebar({ user, className }: NavigationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  const hasAccess = (requiredRoles?: string[]) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return user.roles.some(role => requiredRoles.includes(role));
  };

  // Get navigation items with organization slug
  const navigationItems = user.organization?.slug 
    ? getNavigationItems(user.organization.slug)
    : [];
  
  const filteredNavigationItems = navigationItems.filter(item => hasAccess(item.roles));

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.children) {
      return item.children.some(child => isItemActive(child));
    }
    return false;
  };

  return (
    <div
      className={cn(
        'relative flex h-full flex-col border-r bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {user.organization?.logo_url ? (
              <img
                src={user.organization.logo_url}
                alt="Logo"
                className="h-6 w-6"
              />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold truncate max-w-[180px]">
                {user.organization?.name || 'Concrete Manager'}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                Pump Management
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {filteredNavigationItems.map((item) => {
            const isActive = isItemActive(item);
            const isExpanded = expandedItems.has(item.name);
            const hasChildren = item.children && item.children.length > 0;
            const filteredChildren = hasChildren 
              ? item.children!.filter(child => hasAccess(child.roles))
              : [];

            return (
              <div key={item.name}>
                {/* Parent Item */}
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )}
                    title={isCollapsed ? `${item.name} - ${item.description}` : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs opacity-70">{item.description}</span>
                      </div>
                    )}
                  </Link>
                ) : (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground w-full',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )}
                    title={isCollapsed ? `${item.name} - ${item.description}` : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <>
                        <div className="flex flex-col flex-1 text-left">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs opacity-70">{item.description}</span>
                        </div>
                        {hasChildren && (
                          <ChevronRight 
                            className={cn(
                              'h-4 w-4 transition-transform',
                              isExpanded ? 'rotate-90' : ''
                            )} 
                          />
                        )}
                      </>
                    )}
                  </button>
                )}

                {/* Children Items */}
                {!isCollapsed && hasChildren && isExpanded && filteredChildren.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {filteredChildren.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href!}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                            isChildActive
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          <child.icon className="h-4 w-4 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-medium">{child.name}</span>
                            <span className="text-xs opacity-70">{child.description}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate">
                {user.first_name} {user.last_name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user.roles.includes('organization_admin') ? 'Administrator' :
                 user.roles.includes('manager') ? 'Manager' :
                 user.roles.includes('dispatcher') ? 'Dispatcher' :
                 user.roles.includes('accountant') ? 'Accountant' :
                 user.roles.includes('pompist') ? 'Pompist' : 'User'}
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <form action="/auth/signout" method="post" className="mt-3">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        )}
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}