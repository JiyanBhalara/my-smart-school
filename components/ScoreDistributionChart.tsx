// components/ScoreDistributionChart.tsx
"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ScoreDistributionChartProps {
  data: {
    failing: number;
    passing: number;
    good: number;
    excellent: number;
  };
}

export default function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  const chartData = {
    labels: ["Failing (<60%)", "Passing (60-79%)", "Good (80-89%)", "Excellent (≥90%)"],
    datasets: [
      {
        data: [data.failing, data.passing, data.good, data.excellent],
        backgroundColor: [
          "#EF4444", // Red for failing
          "#F59E0B", // Yellow for passing
          "#3B82F6", // Blue for good
          "#10B981", // Green for excellent
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${context.raw} students (${percentage}%)`;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
