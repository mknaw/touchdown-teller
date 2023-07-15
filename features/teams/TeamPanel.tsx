import React, { useEffect, useState } from 'react';

import { useIndexedDBStore } from 'use-indexeddb';

import Stack from '@mui/material/Stack';

import LabeledSlider from '@/components/LabeledSlider';
import { setupPersistence, teamStoreKey } from '@/data/persistence';
import TeamSeason, { TeamSeasonData } from '@/models/TeamSeason';
import { TeamWithExtras, lastYear } from '@/types';

interface TeamStatsPanelProps {
  team: TeamWithExtras;
  passingTotal: number;
}

export default function TeamPanel({ team, passingTotal }: TeamStatsPanelProps) {
  const teamStore = useIndexedDBStore<TeamSeasonData>(teamStoreKey);

  const lastSeason = team.seasons[0];
  if (!lastSeason) {
    return null;
  }

  useEffect(() => {
    async function fetch() {
      await setupPersistence();
      const teamProjectionData = await teamStore.getByID(team.key);
      if (teamProjectionData) {
        setTeamSeason(new TeamSeason(teamProjectionData));
      } else {
        const newTeamSeason = TeamSeason.fromPrisma(lastSeason);
        setTeamSeason(newTeamSeason);
        teamStore.add(newTeamSeason, team.key);
      }
    }
    fetch();
  }, [team, teamStore]);

  const [teamProjection, setTeamSeason] = useState<TeamSeason | null>(null);
  const persistTeamSeason = (data: TeamSeasonData) => {
    const teamProjection = new TeamSeason(data);
    teamStore.update(teamProjection, team.key);
    setTeamSeason(teamProjection);
  };

  if (!teamProjection) {
    return null;
  }
  // TODO these should come from some kind of utils
  const lastRatio =
    100 * (lastSeason.passAtt / (lastSeason.passAtt + lastSeason.rushAtt));

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

  const onChangeCommitted = (event: React.SyntheticEvent | Event) => {
    const { target } = event;
    if (target) {
      const { name, value } = target as HTMLInputElement;
      persistTeamSeason({
        ...teamProjection,
        [name as keyof TeamSeasonData]: value,
      });
    }
  };

  return (
    <Stack className={'w-full h-full'} spacing={2}>
      <LabeledSlider
        label={`Pass attempts: ${teamProjection.passAtt.toFixed(
          1
        )} (statted ${passingTotal.toFixed(1)})`}
        value={teamProjection.passAtt}
        min={255}
        max={850}
        step={1}
        marks={[
          {
            label: `${lastYear}: ${lastSeason.passAtt.toFixed(1)}`,
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
        label={'Pass-to-Run Ratio'}
        value={50}
        min={1}
        max={99}
        step={0.1}
        marks={[
          {
            label: `${lastYear}: ${lastRatio.toFixed(1)}%`,
            value: lastRatio,
          },
        ]}
        aria-label='Default'
        valueLabelDisplay='auto'
        name='passRunRatio'
        onChange={handleInputChange}
        onChangeCommitted={onChangeCommitted}
      />
    </Stack>
  );
}
