import { useEffect, useState } from 'react';

import _ from 'lodash';
import Link from 'next/link';

import { Player } from '@prisma/client';

import { Button } from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';

import { getPlayerProjections } from '@/data/client';
import { PlayerProjection } from '@/models/PlayerSeason';

function CustomToolbar({
  setIsScoringModalOpen,
}: {
  setIsScoringModalOpen: (open: boolean) => void;
}) {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <Button onClick={() => setIsScoringModalOpen(true)}>
        Scoring Settings
      </Button>
    </GridToolbarContainer>
  );
}

// TODO I did neglect that this makes it very difficult to project free agents...
const TeamLink = (params: {
  value?: string;
  row: { teamName?: string | null };
}) => {
  return params.row.teamName ? (
    <Link href={`/teams/${params.row.teamName}`}>{params.value}</Link>
  ) : (
    params.value
  );
};

export default function ADPTable({
  players,
  setIsScoringModalOpen,
}: {
  players: Player[];
  setIsScoringModalOpen: (open: boolean) => void;
}) {
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
        slots={{
          toolbar: () => (
            <CustomToolbar setIsScoringModalOpen={setIsScoringModalOpen} />
          ),
        }}
        columns={[
          {
            field: 'adp',
            headerName: 'ADP',
            flex: 1,
            type: 'number',
            sortable: true,
          },
          // TODO for this one would be cool to preselect the player upon redirect
          {
            field: 'name',
            headerName: 'Name',
            flex: 3,
            renderCell: TeamLink,
            sortable: false,
          },
          {
            field: 'position',
            headerName: 'Position',
            flex: 1,
            sortable: false,
            type: 'singleSelect',
            valueOptions: ['QB', 'RB', 'WR', 'TE'],
          },
          {
            field: 'teamName',
            headerName: 'Team',
            flex: 1,
            renderCell: TeamLink,
            sortable: true,
          },
          // TODO replace with a projected points, just trying to prove it out
          {
            field: 'passAtt',
            headerName: 'Pass Attempts',
            flex: 1,
            valueGetter: (_value, row) => row.pass?.att,
            sortable: false,
          },
        ]}
        initialState={{
          density: 'compact',
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
