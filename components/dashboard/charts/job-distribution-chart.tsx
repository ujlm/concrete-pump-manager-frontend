'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { DashboardWidget } from '../dashboard-widget';
import { ChartData } from '@/lib/types/database';

ChartJS.register(ArcElement, Tooltip, Legend);

interface JobDistributionChartProps {
  data: ChartData | null;
  isLoading?: boolean;
  error?: string;
  title?: string;
  period?: string;
}

export function JobDistributionChart({
  data,
  isLoading,
  error,
  title = 'Job Distribution',
  period = 'This Month'
}: JobDistributionChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: 'white',
      },
    },
  };

  const defaultColors = [
    'rgba(239, 68, 68, 0.8)',   // Red for cancelled
    'rgba(59, 130, 246, 0.8)',  // Blue for planned
    'rgba(249, 115, 22, 0.8)',  // Orange for planned with own concrete
    'rgba(34, 197, 94, 0.8)',   // Green for completed
  ];

  const chartData = data || {
    labels: [],
    datasets: [{
      label: 'Jobs',
      data: [],
      backgroundColor: defaultColors,
    }]
  };

  // Add default colors if not provided
  if (chartData.datasets[0] && !chartData.datasets[0].backgroundColor) {
    chartData.datasets[0].backgroundColor = defaultColors.slice(0, chartData.labels.length);
  }

  const totalJobs = chartData.datasets[0]?.data.reduce((a: number, b: number) => a + b, 0) || 0;

  return (
    <DashboardWidget
      title={title}
      description={period}
      value={totalJobs}
      isLoading={isLoading}
      error={error}
      size="md"
      actions={[
        {
          label: 'View Jobs',
          href: '/protected/jobs',
        },
      ]}
    >
      <div className="h-48 w-full flex items-center justify-center">
        {data && totalJobs > 0 ? (
          <div className="relative w-full h-full">
            <Doughnut data={chartData} options={options} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{totalJobs}</div>
                <div className="text-xs text-muted-foreground">Total Jobs</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <div className="text-sm">No job data available</div>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
}