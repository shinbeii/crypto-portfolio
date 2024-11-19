// export default React.memo(ChartDisplay);
import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const defaultChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: {
          size: 14,
          family: 'Arial, sans-serif'
        },
        color: '#4A5568'
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0,0,0,0.7)',
      titleFont: {
        family: 'Arial, sans-serif',
        weight: 'bold'
      }
    },
  },
};


const ChartDisplay = ({ activeChart, chartData, chartOptions = defaultChartOptions }) => (
  <div className="w-full h-[300px] flex items-center justify-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    {chartData ? (
      activeChart === "pie" ? (
        <Pie data={chartData} options={chartOptions} />
      ) : (
        <Bar data={chartData} options={chartOptions} />
      )
    ) : (
      <p className="text-gray-500">No data available</p>
    )}
  </div>
);

export default React.memo(ChartDisplay);
