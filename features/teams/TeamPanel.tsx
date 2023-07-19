import React, { Dispatch, SetStateAction, SyntheticEvent } from 'react';

import { TeamSeason as PrismaTeamSeason } from '@prisma/client';

import Stack from '@mui/material/Stack';

import LabeledSlider from '@/components/LabeledSlider';
import { StatType, lastYear } from '@/constants';
import TeamSeason, { TeamSeasonData } from '@/models/TeamSeason';

interface TeamStatsPanelProps {
  statType: StatType;
  teamSeason: TeamSeason;
  setTeamSeason: Dispatch<SetStateAction<TeamSeason | null>>;
  persistTeamSeason: (teamSeason: TeamSeasonData) => void;
  lastSeason: PrismaTeamSeason;
}

// TODO also need validation here...
export default function TeamPanel({
  statType,
  teamSeason,
  setTeamSeason,
  persistTeamSeason,
  lastSeason,
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

  const onChangeCommitted = (event: SyntheticEvent | Event) => {
    const { target } = event;
    if (target) {
      const { name, value } = target as HTMLInputElement;
      persistTeamSeason({
        ...teamSeason,
        [name as keyof TeamSeasonData]: value,
      });
    }
  };

  return (
    <Stack className={'w-full'}>
      {
        {
          [StatType.PASS]: (
            <>
              <LabeledSlider
                label={`Passing Attempts: ${teamSeason.passAtt.toFixed(1)}`}
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
                onChangeCommitted={onChangeCommitted}
              />
              <LabeledSlider
                label={`Passing Yards: ${teamSeason.passYds.toFixed(1)}`}
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
                onChangeCommitted={onChangeCommitted}
              />
              <LabeledSlider
                label={`Passing Touchdowns: ${teamSeason.passTds.toFixed(1)}`}
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
                onChangeCommitted={onChangeCommitted}
              />
            </>
          ),
          // TODO should we add receptions here?
          [StatType.RECV]: (
            <>
              <LabeledSlider
                label={`Passing Attempts: ${teamSeason.passAtt.toFixed(1)}`}
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
                onChangeCommitted={onChangeCommitted}
              />
              <LabeledSlider
                label={`Passing Yards: ${teamSeason.passYds.toFixed(1)}`}
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
                onChangeCommitted={onChangeCommitted}
              />
              <LabeledSlider
                label={`Passing Touchdowns: ${teamSeason.passTds.toFixed(1)}`}
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
                onChangeCommitted={onChangeCommitted}
              />
            </>
          ),
          [StatType.RUSH]: (
            <>
              <LabeledSlider
                label={`Rushing Attempts: ${teamSeason.rushAtt.toFixed(1)}`}
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
                onChangeCommitted={onChangeCommitted}
              />
              <LabeledSlider
                label={`Rushing Yards: ${teamSeason.rushYds.toFixed(1)}`}
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
                onChangeCommitted={onChangeCommitted}
              />
              <LabeledSlider
                label={`Rushing Touchdowns: ${teamSeason.rushTds.toFixed(1)}`}
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
                onChangeCommitted={onChangeCommitted}
              />
            </>
          ),
        }[statType]
      }
    </Stack>
  );
}
