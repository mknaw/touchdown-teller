import React from 'react';
import { Line } from 'react-chartjs-2';

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import _ from 'lodash';

import { PassGame, RecvGame, RushGame } from '@prisma/client';

import { gameCount } from '@/constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Week',
      },
    },
    y: {
      title: {
        display: true,
        text: 'Yards',
      },
    },
  },
};

type Game = PassGame | RecvGame | RushGame;

export default function PlayerGameLog({
  games,
  className,
}: {
  games: Game[];
  className: string;
}) {
  const weeks = Array.from({ length: gameCount + 1 }, (_, i) => i + 1);
  const data = {
    labels: weeks,
    datasets: [
      {
        label: 'Yards',
        // TODO Have to correct this for bye week!
        // or at least show bye week differently.
        data: _.map(weeks, (week) => _.find(games, { week })?.yds),
        backgroundColor: 'rgb(113, 107, 144)',
        borderColor: 'rgb(113, 107, 144, 0.6)',
      },
    ],
  };
  // TODO DEBUG
  if (games.length > 17) {
    alert('Too many games!');
  }
  return (
    <div className={className}>
      <Line options={options} data={data} />
    </div>
  );
}
