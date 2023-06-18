'use client';

import React, { useEffect, useState } from 'react';
import { useIndexedDBStore } from 'use-indexeddb';
import { Game, Player } from '@prisma/client';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import Schedule from 'app/components/Schedule';
import {
    Position,
    TeamKey,
    TeamProjection,
    TeamProjectionData,
} from 'app/types';
import {
    passShareKey,
    recShareKey,
    rushShareKey,
    setupPersistence,
    teamStoreKey,
} from 'app/data/persistence';
import SharePanel from './Share';
import TeamPanel from './Team';

const ProjectionPaper = ({ children }: { children: React.ReactNode }) => (
    <Paper variant="outlined" elevation={3} sx={{ p: 2, height: 1 }}>
        {children}
    </Paper>
);

export interface ProjectionPanelProps {
    team: TeamKey;
    games: Game[]; // Would prefer a `Map` but I think RSC doesn't like it!
    players: Player[]; // Would prefer a `Map` but I think RSC doesn't like it!
}

export default function ProjectionPanel({
    team,
    games,
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
            <Container maxWidth={false} sx={{ height: 1 }}>
                <Grid
                    container
                    alignItems="stretch"
                    justifyContent="stretch"
                    spacing={5}
                    sx={{ height: 1, p: 3 }}
                >
                    <Grid item xs={6}>
                        <Grid container spacing={5}>
                            <Grid item xs={12}>
                                <ProjectionPaper>
                                    <Schedule team={team} games={games} />
                                </ProjectionPaper>
                            </Grid>
                            <Grid item xs={12}>
                                <ProjectionPaper>
                                    <TeamPanel
                                        teamProjection={teamProjection}
                                        persistTeamProjection={persistTeamProjection}
                                    />
                                </ProjectionPaper>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={6}>
                        <ProjectionPaper>
                            <SharePanel
                                team={team}
                                label="Passing"
                                attempts={teamProjection.passAttempts()}
                                players={playerMap}
                                positions={[Position.QB]}
                                storageKey={passShareKey}
                            />
                        </ProjectionPaper>
                    </Grid>
                    <Grid item xs={6}>
                        <ProjectionPaper>
                            <SharePanel
                                team={team}
                                label="Rushing"
                                attempts={teamProjection.rushAttempts()}
                                players={playerMap}
                                positions={[
                                    Position.RB,
                                    Position.QB,
                                    Position.WR,
                                    Position.TE,
                                ]}
                                storageKey={rushShareKey}
                            />
                        </ProjectionPaper>
                    </Grid>
                    <Grid item xs={6}>
                        <ProjectionPaper>
                            <SharePanel
                                team={team}
                                label="Receiving"
                                attempts={teamProjection.passAttempts()}
                                players={playerMap}
                                positions={[
                                    Position.WR,
                                    Position.TE,
                                    Position.RB,
                                ]}
                                storageKey={recShareKey}
                            />
                        </ProjectionPaper>
                    </Grid>
                </Grid>
            </Container>
        )
    );
}
