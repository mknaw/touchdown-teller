import React, { Dispatch, SetStateAction } from 'react';
import { useDispatch } from 'react-redux';

import { TeamSeason as PrismaTeamSeason } from '@prisma/client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import LabeledSlider from '@/components/LabeledSlider';
import { StatType, lastYear } from '@/constants';
import {
  PassChartGroup,
  RecvChartGroup,
  RushChartGroup,
} from '@/features/teams/ChartGroup';
import {
  PassAggregate,
  PassSeason,
  RecvAggregate,
  RecvSeason,
  RushAggregate,
  RushSeason,
} from '@/models/PlayerSeason';
import TeamSeason from '@/models/TeamSeason';
import {
  toggleTeamRushSeasonsModal,
  toggleTeamSeasonsModal,
} from '@/store/appStateSlice';
import { IdMap } from '@/types';
import { makeIdMap } from '@/utils';

const valueLabelFormat = (value: number) => value.toFixed(0);

const filterHistoricalPassAggregates = (seasons: PassAggregate[]) =>
  seasons.filter((s) => s.att > 100);

const filterHistoricalRecvAggregates = (seasons: RecvAggregate[]) =>
  seasons.filter((s) => s.tgt > 50);

const filterHistoricalRushAggregates = (seasons: RushAggregate[]) =>
  seasons.filter((s) => s.att > 50);

interface TeamStatsPanelProps {
  statType: StatType;
  teamSeason: TeamSeason;
  setTeamSeason: Dispatch<SetStateAction<TeamSeason | null>>;
  persistTeamSeason: () => void;
  lastSeason: PrismaTeamSeason;
  // TODO don't really love taking all this stuff here
  passSeasons: IdMap<PassSeason>;
  recvSeasons: IdMap<RecvSeason>;
  rushSeasons: IdMap<RushSeason>;
  passAggregates: PassAggregate[];
  recvAggregates: RecvAggregate[];
  rushAggregates: RushAggregate[];
}

export default function TeamPanel({
  statType,
  teamSeason,
  setTeamSeason,
  persistTeamSeason,
  lastSeason,
  passSeasons,
  recvSeasons,
  rushSeasons,
  passAggregates,
  recvAggregates,
  rushAggregates,
}: TeamStatsPanelProps) {
  const handleInputChange = (event: Event) => {
    const { target } = event;
    if (target) {
      const { name, value } = target as HTMLInputElement;
      setTeamSeason(
        (prevProjection) =>
          prevProjection &&
          new TeamSeason({
            ...prevProjection,
            [name]: value,
          })
      );
    }
  };

  const dispatch = useDispatch();
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
        teamSeason={teamSeason}
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
        teamSeason={teamSeason}
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
        teamSeason={teamSeason}
        lastSeason={lastSeason}
      />
    ),
  }[statType];

  return (
    <>
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
                <LabeledSlider
                  label={`Pass Attempts: ${teamSeason.passAtt.toFixed(1)}`}
                  onClick={onClick}
                  value={teamSeason.passAtt}
                  min={255}
                  max={850}
                  step={0.1}
                  marks={[
                    {
                      label: `${lastYear}: ${lastSeason.passAtt.toFixed(0)}`,
                      value: lastSeason.passAtt,
                    },
                  ]}
                  aria-label='Default'
                  valueLabelDisplay='auto'
                  name='passAtt'
                  onChange={handleInputChange}
                  onChangeCommitted={persistTeamSeason}
                  valueLabelFormat={valueLabelFormat}
                />
                <LabeledSlider
                  label={`Pass Yards: ${teamSeason.passYds.toFixed(1)}`}
                  onClick={onClick}
                  value={teamSeason.passYds}
                  min={2000}
                  max={5500}
                  step={0.1}
                  marks={[
                    {
                      label: `${lastYear}: ${lastSeason.passYds.toFixed(0)}`,
                      value: lastSeason.passYds,
                    },
                  ]}
                  aria-label='Default'
                  valueLabelDisplay='auto'
                  name='passYds'
                  onChange={handleInputChange}
                  onChangeCommitted={persistTeamSeason}
                  valueLabelFormat={valueLabelFormat}
                />
                <LabeledSlider
                  label={`Pass Touchdowns: ${teamSeason.passTds.toFixed(1)}`}
                  onClick={onClick}
                  value={teamSeason.passTds}
                  min={0}
                  max={70}
                  step={0.1}
                  marks={[
                    {
                      label: `${lastYear}: ${lastSeason.passTds.toFixed(0)}`,
                      value: lastSeason.passTds,
                    },
                  ]}
                  aria-label='Default'
                  valueLabelDisplay='auto'
                  name='passTds'
                  onChange={handleInputChange}
                  onChangeCommitted={persistTeamSeason}
                  valueLabelFormat={valueLabelFormat}
                />
              </>
            ),
            // TODO should we add receptions here?
            [StatType.RECV]: (
              <>
                <LabeledSlider
                  label={`Pass Attempts: ${teamSeason.passAtt.toFixed(1)}`}
                  onClick={onClick}
                  value={teamSeason.passAtt}
                  min={255}
                  max={850}
                  step={0.1}
                  marks={[
                    {
                      label: `${lastYear}: ${lastSeason.passAtt.toFixed(0)}`,
                      value: lastSeason.passAtt,
                    },
                  ]}
                  aria-label='Default'
                  valueLabelDisplay='auto'
                  name='passAtt'
                  onChange={handleInputChange}
                  onChangeCommitted={persistTeamSeason}
                  valueLabelFormat={valueLabelFormat}
                />
                <LabeledSlider
                  label={`Pass Yards: ${teamSeason.passYds.toFixed(1)}`}
                  onClick={onClick}
                  value={teamSeason.passYds}
                  min={2000}
                  max={5500}
                  step={0.1}
                  marks={[
                    {
                      label: `${lastYear}: ${lastSeason.passYds.toFixed(0)}`,
                      value: lastSeason.passYds,
                    },
                  ]}
                  aria-label='Default'
                  valueLabelDisplay='auto'
                  name='passYds'
                  onChange={handleInputChange}
                  onChangeCommitted={persistTeamSeason}
                  valueLabelFormat={valueLabelFormat}
                />
                <LabeledSlider
                  label={`Pass Touchdowns: ${teamSeason.passTds.toFixed(1)}`}
                  onClick={onClick}
                  value={teamSeason.passTds}
                  min={0}
                  max={70}
                  step={0.1}
                  marks={[
                    {
                      label: `${lastYear}: ${lastSeason.passTds.toFixed(0)}`,
                      value: lastSeason.passTds,
                    },
                  ]}
                  aria-label='Default'
                  valueLabelDisplay='auto'
                  name='passTds'
                  onChange={handleInputChange}
                  onChangeCommitted={persistTeamSeason}
                  valueLabelFormat={valueLabelFormat}
                />
              </>
            ),
            [StatType.RUSH]: (
              <>
                <LabeledSlider
                  label={`Rush Attempts: ${teamSeason.rushAtt.toFixed(1)}`}
                  onClick={onClick}
                  value={teamSeason.rushAtt}
                  min={255}
                  max={850}
                  step={0.1}
                  marks={[
                    {
                      label: `${lastYear}: ${lastSeason.rushAtt.toFixed(0)}`,
                      value: lastSeason.rushAtt,
                    },
                  ]}
                  aria-label='Default'
                  valueLabelDisplay='auto'
                  name='rushAtt'
                  onChange={handleInputChange}
                  onChangeCommitted={persistTeamSeason}
                  valueLabelFormat={valueLabelFormat}
                />
                <LabeledSlider
                  label={`Rush Yards: ${teamSeason.rushYds.toFixed(1)}`}
                  onClick={onClick}
                  value={teamSeason.rushYds}
                  min={1000}
                  max={5500}
                  step={0.1}
                  marks={[
                    {
                      label: `${lastYear}: ${lastSeason.rushYds.toFixed(0)}`,
                      value: lastSeason.rushYds,
                    },
                  ]}
                  aria-label='Default'
                  valueLabelDisplay='auto'
                  name='rushYds'
                  onChange={handleInputChange}
                  onChangeCommitted={persistTeamSeason}
                  valueLabelFormat={valueLabelFormat}
                />
                <LabeledSlider
                  label={`Rush Touchdowns: ${teamSeason.rushTds.toFixed(1)}`}
                  onClick={onClick}
                  value={teamSeason.rushTds}
                  min={0}
                  max={70}
                  step={0.1}
                  marks={[
                    {
                      label: `${lastYear}: ${lastSeason.rushTds.toFixed(0)}`,
                      value: lastSeason.rushTds,
                    },
                  ]}
                  aria-label='Default'
                  valueLabelDisplay='auto'
                  name='rushTds'
                  onChange={handleInputChange}
                  onChangeCommitted={persistTeamSeason}
                  valueLabelFormat={valueLabelFormat}
                />
              </>
            ),
          }[statType]
        }
      </Stack>
      <div className={'grid grid-flow-row grid-rows-4 h-full overflow-hidden'}>
        {chartGroup}
      </div>
    </>
  );
}
