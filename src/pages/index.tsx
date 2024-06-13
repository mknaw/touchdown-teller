import { useEffect, useState } from 'react';

import _ from 'lodash';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';

import { Player, PrismaClient } from '@prisma/client';

import { DataGrid } from '@mui/x-data-grid';

import { db, getPlayerProjections } from '@/data/client';
import { getAllPlayers } from '@/data/ssr';
import { PlayerProjection } from '@/models/PlayerSeason';

export const getStaticProps = (async () => {
  const prisma = new PrismaClient();
  return {
    props: {
      players: await getAllPlayers(prisma),
    },
  };
}) satisfies GetStaticProps<{
  players: Player[];
}>;

export default function Home({
  players,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [rows, setRows] =
    useState<(Player & Partial<PlayerProjection>)[]>(players);

  useEffect(() => {
    // TODO replace with the thing from `@/data/client`.
    const fetch = async () => {
      const projections = await getPlayerProjections();

      // TODO have to put this through a scoring fn to just get a number

      setRows(
        players.map((player) => ({
          ...player,
          ...projections[player.id],
        }))
      );
    };

    fetch();
  }, [players]);

  return (
    <div className={'text-white'}>
      <DataGrid
        rows={rows}
        columns={[
          { field: 'adp', headerName: 'ADP', flex: 1 },
          { field: 'name', headerName: 'Name', flex: 3 },
          { field: 'position', headerName: 'Position', flex: 1 },
          { field: 'teamName', headerName: 'Team', flex: 1 },
          // TODO replace with a projected points, just trying to prove it out
          {
            field: 'passAtt',
            headerName: 'Pass Attempts',
            flex: 1,
            valueGetter: (_value, row) => row.pass?.att,
          },
        ]}
        initialState={{
          pagination: {
            // TODO for sure prefer inifinite scroll for this, but that's paid MUI only
            // maybe I'll find a different free thing that supports it
            // for now it's fine like this.
            paginationModel: { page: 0, pageSize: 100 },
          },
          sorting: {
            sortModel: [{ field: 'adp', sort: 'asc' }],
          },
        }}
      />
    </div>
  );
}
