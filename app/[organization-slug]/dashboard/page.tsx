import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DashboardWidgetSkeleton } from '@/components/dashboard/dashboard-widget';
import { JobsSummaryWidget } from '@/components/dashboard/jobs-summary-widget';
import { RevenueWidget } from '@/components/dashboard/revenue-widget';
import { ActivePumpsWidget } from '@/components/dashboard/active-pumps-widget';
import { UpcomingJobsWidget } from '@/components/dashboard/upcoming-jobs-widget';
import { PerformanceMetricsWidget } from '@/components/dashboard/performance-metrics-widget';
import { QuickActionsWidget } from '@/components/dashboard/quick-actions-widget';
import { RevenueChart } from '@/components/dashboard/charts/revenue-chart';
import { JobDistributionChart } from '@/components/dashboard/charts/job-distribution-chart';
import { VolumeChart } from '@/components/dashboard/charts/volume-chart';
import {
  getCurrentUser,
  getDashboardStats,
  getRevenueChartData,
  getJobDistributionChartData,
  getVolumeChartData,
} from '@/lib/actions/dashboard';
import { redirect } from 'next/navigation';
import { startOfMonth, endOfMonth } from 'date-fns';

// Individual widget components with data fetching
async function JobsSummarySection() {
  const stats = await getDashboardStats();
  return (
    <JobsSummaryWidget
      data={stats?.todaysJobs || { total: 0, planned: 0, completed: 0, cancelled: 0 }}
      error={!stats ? 'Failed to load job data' : undefined}
    />
  );
}

async function RevenueSection() {
  const stats = await getDashboardStats();
  return (
    <RevenueWidget
      data={stats?.revenue || { today: 0, thisWeek: 0, thisMonth: 0 }}
      error={!stats ? 'Failed to load revenue data' : undefined}
    />
  );
}

async function ActivePumpsSection() {
  const stats = await getDashboardStats();
  return (
    <ActivePumpsWidget
      count={stats?.activePumps || 0}
      error={!stats ? 'Failed to load pump data' : undefined}
    />
  );
}

async function UpcomingJobsSection() {
  const stats = await getDashboardStats();
  return (
    <UpcomingJobsWidget
      jobs={stats?.upcomingJobs || []}
      error={!stats ? 'Failed to load upcoming jobs' : undefined}
    />
  );
}

async function PerformanceMetricsSection() {
  const stats = await getDashboardStats();
  return (
    <PerformanceMetricsWidget
      data={stats?.performanceMetrics || {
        jobCompletionRate: 0,
        averageEfficiency: 0,
        onTimeDeliveryRate: 0,
      }}
      error={!stats ? 'Failed to load performance data' : undefined}
    />
  );
}

async function RevenueChartSection() {
  const today = new Date();
  const chartData = await getRevenueChartData({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  return (
    <RevenueChart
      data={chartData}
      error={!chartData ? 'Failed to load chart data' : undefined}
    />
  );
}

async function JobDistributionChartSection() {
  const chartData = await getJobDistributionChartData();

  return (
    <JobDistributionChart
      data={chartData}
      error={!chartData ? 'Failed to load chart data' : undefined}
    />
  );
}

async function VolumeChartSection() {
  const today = new Date();
  const chartData = await getVolumeChartData({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  return (
    <VolumeChart
      data={chartData}
      error={!chartData ? 'Failed to load chart data' : undefined}
    />
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <DashboardLayout
      user={user}
      title="Dashboard"
      description="Overview of your concrete pumping operations"
    >
      <div className="space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Suspense fallback={<DashboardWidgetSkeleton />}>
            <JobsSummarySection />
          </Suspense>

          <Suspense fallback={<DashboardWidgetSkeleton />}>
            <RevenueSection />
          </Suspense>

          <Suspense fallback={<DashboardWidgetSkeleton />}>
            <ActivePumpsSection />
          </Suspense>

          <div className="md:col-span-1 lg:col-span-1">
            <QuickActionsWidget userRoles={user.roles} />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Suspense fallback={<DashboardWidgetSkeleton className="min-h-[300px]" />}>
              <RevenueChartSection />
            </Suspense>
          </div>

          <Suspense fallback={<DashboardWidgetSkeleton />}>
            <JobDistributionChartSection />
          </Suspense>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Suspense fallback={<DashboardWidgetSkeleton className="min-h-[300px]" />}>
              <UpcomingJobsSection />
            </Suspense>
          </div>

          <div className="space-y-6">
            <Suspense fallback={<DashboardWidgetSkeleton />}>
              <PerformanceMetricsSection />
            </Suspense>

            <Suspense fallback={<DashboardWidgetSkeleton />}>
              <VolumeChartSection />
            </Suspense>
          </div>
        </div>

        {/* Role-based additional content */}
        {user.roles.includes('organization_admin') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="font-semibold mb-3">System Health</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span className="text-green-600">All systems operational</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Status</span>
                  <span className="text-green-600">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Backup</span>
                  <span className="text-muted-foreground">2 hours ago</span>
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-lg bg-card">
              <h3 className="font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Clients</span>
                  <span className="font-medium">48</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Machines</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span>Team Members</span>
                  <span className="font-medium">24</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}