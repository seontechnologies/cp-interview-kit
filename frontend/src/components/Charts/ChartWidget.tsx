import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartWidgetProps {
  config: {
    chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
    title?: string;
    colors?: string[];
  };
  data: any;
}

export default function ChartWidget({ config, data }: ChartWidgetProps) {
  const chartType = config?.chartType || 'bar';
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return {
        labels: [],
        datasets: [
          {
            label: 'No data',
            data: [],
          },
        ],
      };
    }

    const defaultColors = [
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 99, 132, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
    ];

    const colors = config?.colors || defaultColors;

    return {
      labels: data.map((item: any) => item.eventType || item.label || 'Unknown'),
      datasets: [
        {
          label: config?.title || 'Events',
          data: data.map((item: any) => item._count || item.count || item.value || 0),
          backgroundColor: colors,
          borderColor: colors.map((c: string) => c.replace('0.7', '1')),
          borderWidth: 1,
        },
      ],
    };
  }, [data, config]); // config is object, will fail equality check
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartType === 'pie' || chartType === 'doughnut',
        position: 'bottom' as const,
      },
      title: {
        display: !!config?.title,
        text: config?.title,
      },
    },
  };

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  const ChartComponent = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut,
  }[chartType];

  return (
    <div className="h-full p-2">
      <ChartComponent data={chartData} options={options} />
    </div>
  );
}
