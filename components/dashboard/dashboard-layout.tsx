'use client';

import { useState } from 'react';
import { NavigationSidebar } from './navigation-sidebar';
import { DashboardHeader } from './dashboard-header';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types/database';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  title: string;
  description?: string;
  className?: string;
}

export function DashboardLayout({
  children,
  user,
  title,
  description,
  className,
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <NavigationSidebar
          user={{
            first_name: user.first_name,
            last_name: user.last_name,
            roles: user.roles,
            organization: user.organization,
          }}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader
          title={title}
          description={description}
          user={{
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            organization: user.organization,
          }}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Page content */}
        <main className={cn('flex-1 overflow-auto p-4 lg:p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}