import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import _ from 'lodash';

import { TeamSeason as PrismaTeamSeason } from '@prisma/client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import StatSlider from '@/components/StatSlider';
import { StatType, TeamKey } from '@/constants';
import {
  PassChartGroup,
  RecvChartGroup,
  RushChartGroup,
} from '@/features/teams/ChartGroup';
import {
  AnnualizedPassSeason,
  AnnualizedRecvSeason,
  AnnualizedRushSeason,
  PassSeason,
  RecvSeason,
  RushSeason,
  annualizePassSeason,
} from '@/models/PlayerSeason';
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

const filterHistoricalPassAggregates = (seasons: {
  [id: number]: AnnualizedPassSeason;
}) => _.pickBy(seasons, (s) => s.att > 100);

const filterHistoricalRecvAggregates = (seasons: {
  [id: number]: AnnualizedRecvSeason;
}) => _.pickBy(seasons, (s) => s.tgt > 25);

const filterHistoricalRushAggregates = (seasons: {
  [id: number]: AnnualizedRushSeason;
}) => _.pickBy(seasons, (s) => s.att > 50);

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
  names,
}: {
  teamKey: TeamKey;
  statType: StatType;
  lastSeason: PrismaTeamSeason;
  passSeasons: { [id: number]: AnnualizedPassSeason };
  recvSeasons: { [id: number]: AnnualizedRecvSeason };
  rushSeasons: { [id: number]: AnnualizedRushSeason };
  passAggregates: { [id: number]: AnnualizedPassSeason };
  recvAggregates: { [id: number]: AnnualizedRecvSeason };
  rushAggregates: { [id: number]: AnnualizedRushSeason };
  names: { [id: number]: string };
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
        lastSeasons={filterHistoricalPassAggregates(passAggregates)}
        teamSeason={teamProjection}
        lastSeason={lastSeason}
        names={names}
      />
    ),
    [StatType.RECV]: (
      <RecvChartGroup
        seasons={recvSeasons}
        lastSeasons={filterHistoricalRecvAggregates(recvAggregates)}
        teamSeason={teamProjection}
        lastSeason={lastSeason}
        names={names}
      />
    ),
    [StatType.RUSH]: (
      <RushChartGroup
        seasons={rushSeasons}
        lastSeasons={filterHistoricalRushAggregates(rushAggregates)}
        teamSeason={teamProjection}
        lastSeason={lastSeason}
        names={names}
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
      <div className={'grid grid-flow-row grid-rows-4 h-full overflow-hidden'}>
        {chartGroup}
      </div>
    </div>
  );
}
