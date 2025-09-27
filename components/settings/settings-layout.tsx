'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { SettingsSidebar } from './settings-sidebar';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types/database';

interface SettingsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  breadcrumb?: Array<{ name: string; href?: string }>;
  organizationSlug: string;
  user: User;
  className?: string;
}

export function SettingsLayout({
  children,
  title,
  description,
  breadcrumb = [],
  organizationSlug,
  user,
  className,
}: SettingsLayoutProps) {
  const fullBreadcrumb = [
    { name: 'Dashboard', href: `/${organizationSlug}` },
    { name: 'Settings', href: `/${organizationSlug}/settings` },
    ...breadcrumb,
    { name: title },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Settings Sidebar */}
        <SettingsSidebar
          organizationSlug={organizationSlug}
          userRoles={user.roles}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Breadcrumb Navigation */}
          <div className="border-b bg-muted/30 px-6 py-4">
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Home className="h-4 w-4" />
              {fullBreadcrumb.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                  {item.href && index < fullBreadcrumb.length - 1 ? (
                    <Link
                      href={item.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        index === fullBreadcrumb.length - 1
                          ? 'text-foreground font-medium'
                          : ''
                      )}
                    >
                      {item.name}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Page Header */}
          <div className="border-b bg-background px-6 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {description && (
                  <p className="text-muted-foreground mt-2">{description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className={cn('flex-1 p-6', className)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}