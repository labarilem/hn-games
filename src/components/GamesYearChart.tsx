'use client';

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type GamesYearChartProps = {
  gamesCountByYear: Record<string, number>;
};

export default function GamesYearChart({ gamesCountByYear }: GamesYearChartProps) {
  // Sort years and create data for the chart
  const years = Object.keys(gamesCountByYear).sort();
  const counts = years.map((year) => gamesCountByYear[year]);

  const chartData = {
    labels: years,
    datasets: [
      {
        label: "Number of games",
        data: counts,
        borderColor: "rgb(59, 130, 246)", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    plugins: {
      legend: {
        display: false,
        position: "top" as const,
        labels: {
          color: "rgb(209, 213, 219)", // gray-300
        },
      },
      title: {
        display: true,
        text: "Active games by published year",
        color: "rgb(209, 213, 219)", // gray-300
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(107, 114, 128, 0.2)", // gray-500 with opacity
        },
        ticks: {
          color: "rgb(209, 213, 219)", // gray-300
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          autoSkipPadding: 15,
        },
      },
      y: {
        grid: {
          color: "rgba(107, 114, 128, 0.2)", // gray-500 with opacity
        },
        ticks: {
          color: "rgb(209, 213, 219)", // gray-300
        },
      },
    },
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <Line options={options} data={chartData} />
    </div>
  );
}
