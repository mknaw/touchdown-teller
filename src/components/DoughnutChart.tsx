'use client';

import { Doughnut } from 'react-chartjs-2';

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import _ from 'lodash';

// TODO customize this code, prolly
//const plugins = [
//{
//afterUpdate: function (chart: ChartJS) {
//  let a = chart.config.data.datasets.length - 1;
//  for (const i in chart.config.data.datasets) {
//    for (
//      let j = chart.config.data.datasets[i].data.length - 1;
//      j >= 0;
//      --j
//    ) {
//      if (Number(j) == chart.config.data.datasets[i].data.length - 1)
//        continue;
//      const arc = chart.getDatasetMeta(parseInt(i)).data[j];
//      arc.round = {
//        x: (chart.chartArea.left + chart.chartArea.right) / 2,
//        y: (chart.chartArea.top + chart.chartArea.bottom) / 2,
//        radius:
//          chart.innerRadius +
//          chart.radiusLength / 2 +
//          a * chart.radiusLength,
//        thickness: chart.radiusLength / 2 - 1,
//        // backgroundColor: arc._model.backgroundColor,
//      };
//    }
//    a--;
//  }
//},

//afterDraw: function (chart) {
//  const ctx = chart.ctx;
//  for (const i in chart.config.data.datasets) {
//    for (
//      let j = chart.config.data.datasets[i].data.length - 1;
//      j >= 0;
//      --j
//    ) {
//      if (Number(j) == chart.config.data.datasets[i].data.length - 1)
//        continue;
//      const arc = chart.getDatasetMeta(i).data[j];
//      const endAngle = Math.PI / 2 - arc.endAngle;

//      ctx.save();
//      ctx.translate(arc.round.x, arc.round.y * 2);
//      ctx.fillStyle = arc.round.backgroundColor;
//      ctx.beginPath();
//      const startAngle = arc.startAngle;
//      ctx.arc(arc.round.radius * Math.sin(startAngle), arc.round.radius * Math.cos(startAngle), arc.round.thickness, 0, 2 * Math.PI);
//      ctx.arc(
//        arc.round.radius * Math.sin(endAngle),
//        arc.round.radius * Math.cos(endAngle),
//        arc.round.thickness,
//        0,
//        2 * Math.PI
//      );
//      ctx.closePath();
//      ctx.fill();
//      ctx.restore();
//    }
//  }
//},
//},
//];

const options = {
  aspectRatio: 2,
  rotation: -90,
  circumference: 180,
  autoPadding: false,
  plugins: {
    legend: {
      position: 'left' as const,
    },
  },
};

export type ChartData = {
  name: string;
  // TODO have to make it so it allows different stat types...
  att: number;
  yds: number;
  tds: number;
};

export default function DoughnutChart({ data }: { data: ChartData[] }) {
  ChartJS.register(ArcElement, Tooltip, Legend);

  return (
    <Doughnut
      //redraw={true}
      // updateMode ?
      // plugins={plugins}
      options={options}
      data={{
        labels: _.map(data, 'name'),
        datasets: ['att', 'yds'].map((stat) => ({
          label: stat,
          data: _.map(data, stat),
          // TODO should have some sort of color cyclic iterable
          backgroundColor: ['#716b90', 'yellow', 'orange', '#ccc'],
          hoverBackgroundColor: ['#716b90', 'yellow', 'orange', '#ccc'],
        })),
      }}
    />
  );
}
