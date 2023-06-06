import { Metadata } from 'next';
import { PrismaClient, Player } from "@prisma/client";

import Header from 'app/components/Header';
import ProjectionPanel from 'app/components/panels/Projection';
import { TeamKey } from 'app/types';
import { getTeamName } from 'app/utils';

interface Props {
    params: {
        team: TeamKey;
    };
}

export const generateMetadata = async ({
    params: { team },
}: Props): Promise<Metadata> => ({
    title: getTeamName(team),
});

async function getPlayers(team: string): Promise<Player[]> {
    const prisma = new PrismaClient()
    return await prisma.player.findMany({
        where: {
            team: team,
        }
    });
}

export default async function Page({ params: { team } }: Props) {
    const players = await getPlayers(team);
    return (
        <main className="w-full">
            <Header team={team} />
            <ProjectionPanel team={team} players={players} />
        </main>
    );
}
