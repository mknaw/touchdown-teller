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

import { REMAINING_LABEL } from '@/constants';

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
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 0,
  },
};

// TODO should be something cyclic
const colors = [
  '#716b90',
  'yellow',
  'orange',
  '#716b90',
  'yellow',
  'orange',
  '#716b90',
  'yellow',
  'orange',
  '#716b90',
  'yellow',
  'orange',
];

export type StatTuple = [number | undefined, number | undefined];

export type ChartData = {
  name: string;
  stat: StatTuple;
};

export default function HorizontalChart({ data }: { data: ChartData[] }) {
  return (
    <Bar
      options={options}
      data={{
        labels: ['2022', '2023'],
        datasets: data.map((s, i) => ({
          label: s.name,
          data: s.stat, // TODO should have some sort of color cyclic iterable
          backgroundColor: s.name == REMAINING_LABEL ? '#ddd' : colors[i],
          hoverBackgroundColor: colors[i],
        })),
      }}
    />
  );
}
