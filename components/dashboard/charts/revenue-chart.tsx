'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DashboardWidget } from '../dashboard-widget';
import { ChartData } from '@/lib/types/database';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  data: ChartData | null;
  isLoading?: boolean;
  error?: string;
  title?: string;
  period?: string;
}

export function RevenueChart({ data, isLoading, error, title = 'Revenue Trends', period = 'Last 30 Days' }: RevenueChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
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
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `€${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: 'rgba(156, 163, 175, 1)',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: 'rgba(156, 163, 175, 1)',
          callback: function(value: any) {
            return '€' + value.toLocaleString();
          },
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: 'rgba(59, 130, 246, 1)',
        borderColor: 'white',
        borderWidth: 2,
      },
      line: {
        tension: 0.4,
      },
    },
  };

  const chartData = data || {
    labels: [],
    datasets: [{
      label: 'Revenue',
      data: [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
    }]
  };

  return (
    <DashboardWidget
      title={title}
      description={period}
      isLoading={isLoading}
      error={error}
      size="lg"
      actions={[
        {
          label: 'View Details',
          href: '/protected/reports/revenue',
        },
        {
          label: 'Export Chart',
          onClick: () => {
            console.log('Exporting revenue chart...');
          },
          variant: 'secondary',
        },
      ]}
    >
      <div className="h-64 w-full">
        {data && (
          <Line
            data={{
              ...chartData,
              datasets: chartData.datasets.map(dataset => ({
                ...dataset,
                fill: true,
              }))
            }}
            options={options}
          />
        )}
      </div>
    </DashboardWidget>
  );
}