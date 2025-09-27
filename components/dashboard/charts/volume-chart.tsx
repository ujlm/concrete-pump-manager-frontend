'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DashboardWidget } from '../dashboard-widget';
import { ChartData } from '@/lib/types/database';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VolumeChartProps {
  data: ChartData | null;
  isLoading?: boolean;
  error?: string;
  title?: string;
  period?: string;
}

export function VolumeChart({
  data,
  isLoading,
  error,
  title = 'Volume Pumped',
  period = 'Last 30 Days'
}: VolumeChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
            return `${context.parsed.y}m³`;
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
            return value + 'm³';
          },
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      },
    },
  };

  const chartData = data || {
    labels: [],
    datasets: [{
      label: 'Volume (m³)',
      data: [],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 1,
    }]
  };

  const totalVolume = chartData.datasets[0]?.data.reduce((a: number, b: number) => a + b, 0) || 0;

  return (
    <DashboardWidget
      title={title}
      description={period}
      value={`${totalVolume.toLocaleString()}m³`}
      isLoading={isLoading}
      error={error}
      size="md"
      actions={[
        {
          label: 'Volume Report',
          href: '/protected/reports/volume',
        },
        {
          label: 'Export Data',
          onClick: () => {
            console.log('Exporting volume data...');
          },
          variant: 'secondary',
        },
      ]}
    >
      <div className="h-48 w-full">
        {data && totalVolume > 0 ? (
          <Bar
            data={{
              ...chartData,
              datasets: chartData.datasets.map(dataset => ({
                ...dataset,
                backgroundColor: Array.isArray(dataset.backgroundColor)
                  ? dataset.backgroundColor
                  : Array(chartData.labels.length).fill(dataset.backgroundColor),
              }))
            }}
            options={options}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-sm">No volume data available</div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
}