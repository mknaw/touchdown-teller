import _ from 'lodash';

import { TeamSeason as PrismaTeamSeason } from '@prisma/client';

import Typography from '@mui/material/Typography';

import HorizontalChart, { ChartData } from '@/components/HorizontalChart';
import { REMAINING_LABEL } from '@/constants';
import {
  PassAggregate,
  PassSeason,
  RecvAggregate,
  RecvSeason,
  RushAggregate,
  RushSeason,
} from '@/models/PlayerSeason';
import TeamSeason from '@/models/TeamSeason';
import { IdMap } from '@/types';
import { mapMap } from '@/utils';

const HzChart = ({ label, data }: { label: string; data: ChartData[] }) => (
  <div className={'w-full h-12 flex'}>
    <Typography className={'w-1/4'}>{label}</Typography>
    <div className={'w-full'}>
      <HorizontalChart data={data} />
    </div>
  </div>
);

const makeChartData = <
  LS extends { name: string },
  S extends { name: string; annualize: () => { [K in keyof LS]?: number } }
>(
    seasons: IdMap<S>,
    lastSeasons: IdMap<LS>,
    stats: Array<keyof LS>,
    teamSeason: { [K in keyof LS]?: number },
    lastSeason: { [K in keyof LS]?: number }
  ) => {
  const allPlayerIds = _.uniq([...seasons.keys(), ...lastSeasons.keys()]);
  _.toArray(seasons.entries());
  const annualizedSeasons = mapMap(seasons, (s) => ({
    name: s.name,
    ...s.annualize(),
  }));
  const chartData = [];
  for (const playerId of allPlayerIds) {
    const season = annualizedSeasons.get(playerId);
    const lastSeason = lastSeasons.get(playerId);
    const name = season ? season.name : lastSeason ? lastSeason.name : null;
    if (!name) {
      continue;
    }

    chartData.push(
      Object.fromEntries([
        ['name', name],
        ...stats.map((stat) => [
          stat,
          // TODO should filter out beneath some threshold.
          [lastSeason && lastSeason[stat], season && season[stat]],
        ]),
      ])
    );
  }

  const lastSeasonTotals = [...lastSeasons.values()];
  const seasonTotals = [...annualizedSeasons.values()];
  // TODO wonder if this wasn't supposed to be a single obj with all stats.
  chartData.push(
    // TODO fix the typing here
    stats.reduce<any>(
      (acc, stat) => {
        const lastRemaining = Math.max(
          // Really shouldn't ever be < 0... but whatever
          (lastSeason[stat] || 0) - _.sumBy(lastSeasonTotals, stat as string),
          0
        );
        const remaining = Math.max(
          (teamSeason[stat] || 0) - _.sumBy(seasonTotals, stat as string),
          0
        );
        acc[stat] = [lastRemaining, remaining];
        return acc;
      },
      { name: REMAINING_LABEL }
    )
  );
  return chartData;
};

export const PassChartGroup = ({
  seasons,
  lastSeasons,
  teamSeason,
  lastSeason,
}: {
  seasons: IdMap<PassSeason>;
  lastSeasons: IdMap<PassAggregate>;
  teamSeason: TeamSeason;
  lastSeason: PrismaTeamSeason;
}) => {
  const chartData = makeChartData(
    seasons,
    lastSeasons,
    ['att', 'cmp', 'yds', 'tds'],
    {
      att: teamSeason.passAtt,
      cmp: teamSeason.passCmp,
      yds: teamSeason.passYds,
      tds: teamSeason.passTds,
    },
    {
      att: lastSeason.passAtt,
      cmp: lastSeason.passCmp,
      yds: lastSeason.passYds,
      tds: lastSeason.passTds,
    }
  );

  return (
    <>
      <HzChart
        label={'Passing Attempts'}
        data={chartData.map(({ name, att }) => ({ name, stat: att }))}
      />
      <HzChart
        label={'Completions'}
        data={chartData.map(({ name, cmp }) => ({ name, stat: cmp }))}
      />
      <HzChart
        label={'Passing Yards'}
        data={chartData.map(({ name, yds }) => ({ name, stat: yds }))}
      />
      <HzChart
        label={'Passing Touchdowns'}
        data={chartData.map(({ name, tds }) => ({ name, stat: tds }))}
      />
    </>
  );
};

export const RecvChartGroup = ({
  seasons,
  lastSeasons,
  teamSeason,
  lastSeason,
}: {
  seasons: IdMap<RecvSeason>;
  lastSeasons: IdMap<RecvAggregate>;
  teamSeason: TeamSeason;
  lastSeason: PrismaTeamSeason;
}) => {
  const chartData = makeChartData(
    seasons,
    lastSeasons,
    ['tgt', 'rec', 'yds', 'tds'],
    {
      tgt: teamSeason.passAtt,
      rec: teamSeason.passCmp,
      yds: teamSeason.passYds,
      tds: teamSeason.passTds,
    },
    {
      tgt: lastSeason.passAtt,
      rec: lastSeason.passCmp,
      yds: lastSeason.passYds,
      tds: lastSeason.passTds,
    }
  );

  return (
    <>
      <HzChart
        label={'Targets'}
        data={chartData.map(({ name, tgt }) => ({ name, stat: tgt }))}
      />
      <HzChart
        label={'Receptions'}
        data={chartData.map(({ name, rec }) => ({ name, stat: rec }))}
      />
      <HzChart
        label={'Receiving Yards'}
        data={chartData.map(({ name, yds }) => ({ name, stat: yds }))}
      />
      <HzChart
        label={'Receiving Touchdowns'}
        data={chartData.map(({ name, tds }) => ({ name, stat: tds }))}
      />
    </>
  );
};

export const RushChartGroup = ({
  seasons,
  lastSeasons,
  teamSeason,
  lastSeason,
}: {
  seasons: IdMap<RushSeason>;
  lastSeasons: IdMap<RushAggregate>;
  teamSeason: TeamSeason;
  lastSeason: PrismaTeamSeason;
}) => {
  const chartData = makeChartData(
    seasons,
    lastSeasons,
    ['att', 'yds', 'tds'],
    {
      att: teamSeason.rushAtt,
      yds: teamSeason.rushYds,
      tds: teamSeason.rushTds,
    },
    {
      att: lastSeason.rushAtt,
      yds: lastSeason.rushYds,
      tds: lastSeason.rushTds,
    }
  );

  return (
    <>
      <HzChart
        label={'Carries'}
        data={chartData.map(({ name, att }) => ({ name, stat: att }))}
      />
      <HzChart
        label={'Rushing Yards'}
        data={chartData.map(({ name, yds }) => ({ name, stat: yds }))}
      />
      <HzChart
        label={'Rushing Touchdowns'}
        data={chartData.map(({ name, tds }) => ({ name, stat: tds }))}
      />
    </>
  );
};
