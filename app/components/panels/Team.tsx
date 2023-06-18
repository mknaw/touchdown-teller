import React, { useEffect, useState } from 'react';

import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { TeamProjectionData, TeamProjection } from 'app/types';

const minPlaysPerGame = 45;
const maxPlaysPerGame = 85;

interface TeamStatsPanelProps {
    teamProjection: TeamProjection;
    persistTeamProjection: (data: TeamProjectionData) => void;
}

export default function TeamPanel({
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

    const handleInputChange = (event: Event) => {
        const { target } = event;
        if (target) {
            const { name, value } = target as HTMLInputElement;
            setLocalData(
                prevProjection =>
                    new TeamProjection({
                        ...prevProjection,
                        [name]: value,
                    })
            );
        }
    };

    const onChangeCommitted = (event: any) => {
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
        <Stack sx={{ height: 1 }} spacing={2}>
            <Stack alignItems="center" spacing={2}>
                <Typography>Plays per game</Typography>
                <Slider
                    value={localData.playsPerGame}
                    min={minPlaysPerGame}
                    max={maxPlaysPerGame}
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    name="playsPerGame"
                    onChange={handleInputChange}
                    onChangeCommitted={onChangeCommitted}
                />
            </Stack>
            <Stack alignItems="center" spacing={2}>
                <Typography>Pass-to-Run Ratio</Typography>
                <Slider
                    value={localData.passRunRatio}
                    min={1}
                    max={99}
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    name="passRunRatio"
                    onChange={handleInputChange}
                    onChangeCommitted={onChangeCommitted}
                />
            </Stack>
        </Stack>
    );
}
