import React, { useEffect, useState } from 'react';

import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  TeamProjection,
  TeamProjectionData,
  TeamWithExtras,
  lastSeason,
} from 'app/types';

const minPlaysPerGame = 45;
const maxPlaysPerGame = 75;

interface TeamStatsPanelProps {
  team: TeamWithExtras;
  teamProjection: TeamProjection;
  persistTeamProjection: (data: TeamProjectionData) => void;
}

export default function TeamPanel({
  team,
  teamProjection,
  persistTeamProjection,
}: TeamStatsPanelProps) {
  const [localData, setLocalData] = useState<TeamProjection>(teamProjection);
  useEffect(() => {
    setLocalData(teamProjection);
  }, [teamProjection]);

  if (!localData) {
    return null;
  }

  const season = team.seasons[0];
  if (!season) {
    return null;
  }
  const ppg = (season.passAtt + season.rushAtt) / 17;
  const passRunRatio =
    100 * (season.passAtt / (season.passAtt + season.rushAtt));

  const handleInputChange = (event: Event) => {
    const { target } = event;
    if (target) {
      const { name, value } = target as HTMLInputElement;
      setLocalData(
        (prevProjection) =>
          new TeamProjection({
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
      persistTeamProjection({
        ...localData,
        [name as keyof TeamProjectionData]: value,
      });
    }
  };

  // TODO instead of total and ratio maybe just do total passing / running?
  return (
    <Stack className={'h-full'} spacing={2}>
      <Stack alignItems='center' spacing={2}>
        <Typography>Plays per game</Typography>
        <Slider
          value={localData.playsPerGame}
          min={minPlaysPerGame}
          max={maxPlaysPerGame}
          step={0.1}
          marks={[
            {
              label: `${lastSeason}: ${ppg.toFixed(1)}`,
              value: ppg,
            },
          ]}
          aria-label='Default'
          valueLabelDisplay='auto'
          name='playsPerGame'
          onChange={handleInputChange}
          onChangeCommitted={onChangeCommitted}
        />
      </Stack>
      <Stack alignItems='center' spacing={2}>
        <Typography>Pass-to-Run Ratio</Typography>
        <Slider
          value={localData.passRunRatio}
          min={1}
          max={99}
          step={0.1}
          marks={[
            {
              label: `${lastSeason}: ${passRunRatio.toFixed(1)}%`,
              value: passRunRatio,
            },
          ]}
          aria-label='Default'
          valueLabelDisplay='auto'
          name='passRunRatio'
          onChange={handleInputChange}
          onChangeCommitted={onChangeCommitted}
        />
      </Stack>
    </Stack>
  );
}
