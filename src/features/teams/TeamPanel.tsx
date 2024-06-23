import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import _ from 'lodash';

import { TeamSeason as PrismaTeamSeason } from '@prisma/client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import StatSlider from '@/components/StatSlider';
import { StatType, TeamKey } from '@/constants';
import { PassAggregate, RecvAggregate, RushAggregate } from '@/data/ssr';
import {
  PassChartGroup,
  RecvChartGroup,
  RushChartGroup,
} from '@/features/teams/ChartGroup';
import { PassSeason, RecvSeason, RushSeason } from '@/models/PlayerSeason';
import { TeamSeason } from '@/models/TeamSeason';
import { teamSeasonFromPrisma } from '@/models/TeamSeason';
import { AppState, useAppDispatch } from '@/store';
import {
  toggleTeamRushSeasonsModal,
  toggleTeamSeasonsModal,
} from '@/store/appStateSlice';
import {
  TeamProjectionStore,
  loadTeamProjection,
  persistTeamProjection,
  setTeamProjection,
} from '@/store/teamProjectionSlice';
import { IdMap } from '@/types';
import { makeIdMap } from '@/utils';

const filterHistoricalPassAggregates = (seasons: PassAggregate[]) =>
  seasons.filter((s) => s.att > 100);

const filterHistoricalRecvAggregates = (seasons: RecvAggregate[]) =>
  seasons.filter((s) => s.tgt > 50);

const filterHistoricalRushAggregates = (seasons: RushAggregate[]) =>
  seasons.filter((s) => s.att > 50);

export default function TeamPanel({
  teamKey,
  statType,
  lastSeason,
  passSeasons,
  recvSeasons,
  rushSeasons,
  passAggregates,
  recvAggregates,
  rushAggregates,
}: {
  teamKey: TeamKey;
  statType: StatType;
  lastSeason: PrismaTeamSeason;
  // TODO don't really love taking all this stuff here
  passSeasons: IdMap<PassSeason>;
  recvSeasons: IdMap<RecvSeason>;
  rushSeasons: IdMap<RushSeason>;
  passAggregates: PassAggregate[];
  recvAggregates: RecvAggregate[];
  rushAggregates: RushAggregate[];
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadTeamProjection(teamKey as TeamKey)).then(({ payload }) => {
      if (!payload) {
        const projection = teamSeasonFromPrisma(lastSeason);
        dispatch(persistTeamProjection(projection));
      }
    });
  }, [dispatch, teamKey]);

  const { projection: teamProjection } = useSelector<
    AppState,
    TeamProjectionStore
  >((state) => state.teamProjection);

  if (!teamProjection) {
    // Shouldn't happen.
    return null;
  }

  const teamPanelHeader = {
    [StatType.PASS]: 'Team Passing Stats',
    [StatType.RECV]: 'Team Receiving Stats',
    [StatType.RUSH]: 'Team Rushing Stats',
  }[statType];

  const toggle = {
    [StatType.PASS]: toggleTeamSeasonsModal,
    [StatType.RECV]: toggleTeamSeasonsModal,
    [StatType.RUSH]: toggleTeamRushSeasonsModal,
  }[statType];
  const onClick = () => dispatch(toggle());

  const chartGroup = {
    [StatType.PASS]: (
      <PassChartGroup
        seasons={passSeasons}
        lastSeasons={makeIdMap(
          filterHistoricalPassAggregates(passAggregates),
          'playerId'
        )}
        teamSeason={teamProjection}
        lastSeason={lastSeason}
      />
    ),
    [StatType.RECV]: (
      <RecvChartGroup
        seasons={recvSeasons}
        lastSeasons={makeIdMap(
          filterHistoricalRecvAggregates(recvAggregates),
          'playerId'
        )}
        teamSeason={teamProjection}
        lastSeason={lastSeason}
      />
    ),
    [StatType.RUSH]: (
      <RushChartGroup
        seasons={rushSeasons}
        lastSeasons={makeIdMap(
          filterHistoricalRushAggregates(rushAggregates),
          'playerId'
        )}
        teamSeason={teamProjection}
        lastSeason={lastSeason}
      />
    ),
  }[statType];

  const commonSliderProps = {
    current: teamProjection,
    persist: (v: TeamSeason) => dispatch(persistTeamProjection(v)),
    set: (v: TeamSeason) => dispatch(setTeamProjection(v)),
    previous: teamSeasonFromPrisma(lastSeason),
    onClick,
  };

  return (
    <div className={'flex flex-col w-full h-full'}>
      {/* TODO ought to do a better job of vertical alignment with LHS */}
      <Typography
        className={'text-2xl w-full text-center cursor-pointer py-4'}
        onClick={onClick}
      >
        {teamPanelHeader}
      </Typography>
      <Stack className={'w-full'}>
        {
          {
            [StatType.PASS]: (
              <>
                <StatSlider
                  label={'Pass Attempts'}
                  path={'passAtt'}
                  min={255}
                  max={850}
                  step={1}
                  {...commonSliderProps}
                />
                <StatSlider
                  label={'Passing Yards'}
                  path={'passYds'}
                  min={2000}
                  max={5500}
                  step={1}
                  {...commonSliderProps}
                />
                <StatSlider
                  label={'Passing Touchdowns'}
                  path={'passTds'}
                  min={0}
                  max={70}
                  step={1}
                  {...commonSliderProps}
                />
              </>
            ),
            // TODO should we add receptions here? Otherwise it's kinda the same as before?
            [StatType.RECV]: (
              <>
                <StatSlider
                  label={'Pass Attempts'}
                  path={'passAtt'}
                  min={255}
                  max={850}
                  step={1}
                  {...commonSliderProps}
                />
                <StatSlider
                  label={'Passing Yards'}
                  path={'passYds'}
                  min={2000}
                  max={5500}
                  step={1}
                  {...commonSliderProps}
                />
                <StatSlider
                  label={'Passing Touchdowns'}
                  path={'passTds'}
                  min={0}
                  max={70}
                  step={1}
                  {...commonSliderProps}
                />
              </>
            ),
            [StatType.RUSH]: (
              <>
                <StatSlider
                  label={'Rush Attempts'}
                  path={'rushAtt'}
                  min={255}
                  max={850}
                  step={1}
                  {...commonSliderProps}
                />
                <StatSlider
                  label={'Rushing Yards'}
                  path={'rushYds'}
                  min={1000}
                  max={5500}
                  step={1}
                  {...commonSliderProps}
                />
                <StatSlider
                  label={'Rushing Touchdowns'}
                  path={'rushTds'}
                  min={0}
                  max={70}
                  step={1}
                  {...commonSliderProps}
                />
              </>
            ),
          }[statType]
        }
      </Stack>
      <div className={'bg-red-500 p-16'}>CHART GOES HERE</div>
      {/*
      <div className={'grid grid-flow-row grid-rows-4 h-full overflow-hidden'}>
        {chartGroup}
      </div>
      */}
    </div>
  );
}
