'use client';

import { Doughnut } from 'react-chartjs-2';

import { ArcElement, Chart as ChartJS, Tooltip } from 'chart.js';

// TODO customize this code, prolly
const plugins = [
  {
    afterUpdate: function (chart) {
      let a = chart.config.data.datasets.length - 1;
      for (const i in chart.config.data.datasets) {
        for (
          let j = chart.config.data.datasets[i].data.length - 1;
          j >= 0;
          --j
        ) {
          if (Number(j) == chart.config.data.datasets[i].data.length - 1)
            continue;
          const arc = chart.getDatasetMeta(i).data[j];
          arc.round = {
            x: (chart.chartArea.left + chart.chartArea.right) / 2,
            y: (chart.chartArea.top + chart.chartArea.bottom) / 2,
            radius:
              chart.innerRadius +
              chart.radiusLength / 2 +
              a * chart.radiusLength,
            thickness: chart.radiusLength / 2 - 1,
            // backgroundColor: arc._model.backgroundColor,
          };
        }
        a--;
      }
    },

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
    //      console.log(arc);
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
  },
];

export default function DoughnutChart() {
  ChartJS.register(ArcElement, Tooltip);

  return (
    <Doughnut
      redraw={true}
      // updateMode ?
      legend={{ display: false }}
      plugins={plugins}
      options={{
        elements: {
          center: {
            // the longest text that could appear in the center
            maxText: '100%',
            text: '67%',
            fontColor: '#FF6684',
            fontFamily: '\'Helvetica Neue\', \'Helvetica\', \'Arial\', sans-serif',
            fontStyle: 'normal',
            // fontSize: 12,
            // if a fontSize is NOT specified, we will scale (within the below limits) maxText to take up the maximum space in the center
            // if these are not specified either, we default to 1 and 256
            minFontSize: 1,
            maxFontSize: 256,
          },
        },
        legend: false,
        rotation: -90,
        circumference: 180,
      }}
      data={{
        labels: ['Steve Foo', 'Joe Bar', 'Don Baz'],
        datasets: [
          {
            data: [90, 15, 10, 10],
            backgroundColor: ['green', 'yellow', 'orange', '#ccc'],
            hoverBackgroundColor: ['green', 'yellow', 'orange', '#ccc'],
          },
        ],
      }}
    />
  );
}
