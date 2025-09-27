'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ExternalLink, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  description?: string;
  value?: string | number;
  previousValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  children?: ReactNode;
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'secondary' | 'ghost';
  }[];
  isLoading?: boolean;
  error?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'default' | 'success' | 'warning' | 'error';
}

export function DashboardWidget({
  title,
  description,
  value,
  previousValue,
  trend,
  children,
  actions,
  isLoading,
  error,
  className,
  size = 'md',
  status = 'default',
}: DashboardWidgetProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/50';
      case 'error':
        return 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50';
      default:
        return '';
    }
  };

  const sizeClasses = {
    sm: 'min-h-[120px]',
    md: 'min-h-[160px]',
    lg: 'min-h-[200px]',
  };

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50', sizeClasses[size], className)}>
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-200">{title}</CardTitle>
          {description && (
            <CardDescription className="text-red-600 dark:text-red-400">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-700 dark:text-red-300">
            Error: {error}
          </div>
          {actions?.some(action => action.onClick) && (
            <div className="mt-4">
              {actions
                .filter(action => action.onClick)
                .map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.onClick}
                    className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Retry
                  </Button>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(sizeClasses[size], getStatusColor(), className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          {status !== 'default' && (
            <Badge
              variant={
                status === 'success'
                  ? 'default'
                  : status === 'warning'
                  ? 'secondary'
                  : 'destructive'
              }
              className="ml-2"
            >
              {status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Value display */}
            {value !== undefined && (
              <div className="flex items-end gap-2 mb-4">
                <div className="text-2xl font-bold">{value}</div>
                {previousValue !== undefined && trend && (
                  <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                    {getTrendIcon()}
                    <span>
                      {typeof previousValue === 'number' && typeof value === 'number'
                        ? `${Math.abs(((value - previousValue) / previousValue) * 100).toFixed(1)}%`
                        : 'vs previous'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Custom content */}
            {children}
          </>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 mt-4">
            {actions.map((action, index) => (
              action.href ? (
                <Button
                  key={index}
                  variant={action.variant || 'ghost'}
                  size="sm"
                  asChild
                  className="h-8"
                >
                  <Link href={action.href} className="inline-flex items-center gap-1">
                    {action.label}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              ) : (
                <Button
                  key={index}
                  variant={action.variant || 'ghost'}
                  size="sm"
                  onClick={action.onClick}
                  className="h-8"
                >
                  {action.label}
                </Button>
              )
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton loader for dashboard widgets
export function DashboardWidgetSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('min-h-[160px]', className)}>
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-8 w-1/3 bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}