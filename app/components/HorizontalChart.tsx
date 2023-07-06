import React from 'react';
import { Bar } from 'react-chartjs-2';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  indexAxis: 'y' as const,
  elements: {
    bar: {
      borderWidth: 2,
    },
  },
  responsive: true,
  plugins: {
    legend: {
      position: 'right' as const,
    },
  },
};

const labels = ['Plays per Game'];

export const data = {
  labels,
  responsive: true,
  maintainAspectRatio: false,
  datasets: [
    {
      label: '2022',
      data: [65],
      borderColor: '#716b90',
      backgroundColor: '#716b90',
    },
    {
      label: '2023 (projected)',
      data: [28],
      borderColor: 'yellow',
      backgroundColor: 'yellow',
    },
  ],
};

export default function HorizontalChart() {
  return <Bar options={options} data={data} />;
}
