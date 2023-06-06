'use client';

import React, { useEffect, useState } from 'react';
import { useIndexedDBStore } from 'use-indexeddb';
import { Player } from '@prisma/client';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';

import { Position, TeamKey, TeamProjection, TeamProjectionData } from 'app/types';
import {
    passShareKey,
    recShareKey,
    rushShareKey,
    setupPersistence,
    teamStoreKey,
} from 'app/data/persistence';
import SharePanel from './Share';
import TeamPanel from './Team';

export interface ProjectionPanelProps {
    team: TeamKey;
    players: Player[]; // Would prefer a `Map` but I think RSC doesn't like it!
}

export default function ProjectionPanel({
    team,
    players,
}: ProjectionPanelProps) {
    const playerMap = new Map(players.map(p => [p.id, p]));
    const teamStore = useIndexedDBStore<TeamProjectionData>(teamStoreKey);

    useEffect(() => {
        async function fetch() {
            await setupPersistence();
            const teamProjectionData = await teamStore.getByID(team);
            if (teamProjectionData) {
                setTeamProjection(new TeamProjection(teamProjectionData));
            } else {
                const newTeamProjection = TeamProjection.default();
                setTeamProjection(newTeamProjection);
                teamStore.add(newTeamProjection, team);
            }
        }
        fetch();
    }, [team, teamStore, players]);

    const [teamProjection, setTeamProjection] = useState<TeamProjection | null>(
        null
    );
    const persistTeamProjection = (data: TeamProjectionData) => {
        // Update the team projection in the persistence layer
        const teamProjection = new TeamProjection(data);
        teamStore.update(teamProjection, team);
        setTeamProjection(teamProjection);
    };

    return (
        teamProjection && (
            <Container maxWidth={false}>
                <Grid container spacing={5} sx={{ p: 3 }}>
                    <Grid item xs={6}>
                        <TeamPanel
                            teamProjection={teamProjection}
                            persistTeamProjection={persistTeamProjection}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <SharePanel
                            team={team}
                            label="Passing"
                            attempts={teamProjection.passAttempts()}
                            players={playerMap}
                            positions={[Position.QB]}
                            storageKey={passShareKey}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <SharePanel
                            team={team}
                            label="Rushing"
                            attempts={teamProjection.rushAttempts()}
                            players={playerMap}
                            positions={[Position.RB, Position.QB, Position.WR, Position.TE]}
                            storageKey={rushShareKey}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <SharePanel
                            team={team}
                            label="Receiving"
                            attempts={teamProjection.passAttempts()}
                            players={playerMap}
                            positions={[Position.WR, Position.TE, Position.RB]}
                            storageKey={recShareKey}
                        />
                    </Grid>
                </Grid>
            </Container>
        )
    );
}
