import { useEffect, useState } from 'react';

import _ from 'lodash';
import Link from 'next/link';

import { Player } from '@prisma/client';

import DndTable from '@/components/DndTable';
import { TableRow } from '@/components/DndTable';
import { getPlayerProjections, getScoringSettings } from '@/data/client';
import { PlayerProjection } from '@/models/PlayerSeason';
import {
  Ranking,
  getRankings,
  initializeRankings,
  updateRankings,
} from '@/models/Ranking';
import { ScoringSettings, scoreProjection } from '@/models/ScoringSettings';

type PlayerRow = Player & {
  rank: number;
  positionRank: number;
  projection: number | null;
};

const isDragAllowed = (
  sortConfig: { key: string; direction: string } | undefined
) => {
  return sortConfig?.key === 'rank';
};

const RankCell = (row: TableRow) => {
  const diff = row.adp - row.rank;
  return (
    <>
      <span className='mr-1'>{row.rank}</span>
      <span className='text-gray-400'>{`(${diff > 0 ? '+' : ''}${diff})`}</span>
    </>
  );
};

const PlayerCell = (row: TableRow) => {
  // Do it like this so tailwind knows it's part of our shit.
  const color =
    {
      RB: 'bg-red-100 text-red-800',
      WR: 'bg-green-100 text-green-800',
      TE: 'bg-orange-100 text-orange-800',
      QB: 'bg-purple-100 text-purple-800',
    }[row.position as string] || '';

  return (
    // {row.teamName ? (
    //   <Link href={`/teams/${row.teamName}`}>{row.name}</Link>
    // ) : (
    //   row.name
    // )}
    <span>
      <span
        className={`px-2 py-1 mr-2 text-xs font-medium rounded-full w-14 inline-block text-center ${color}`}
      >
        {row.position}
        {row.positionRank}
      </span>
      {row.name}
    </span>
  );
};

async function getOrInitRankings(players: Player[]): Promise<Ranking[]> {
  let rankings = await getRankings();

  // TODO here we probably ought to do some self-healing, corrective checks...
  if (rankings.length === 0) {
    await initializeRankings(players);
    rankings = await getRankings();
  }
  return rankings;
}

const setRankEnumerated = (players: PlayerRow[]) => {
  let rank = 0;
  const positionRanks: Record<string, number> = {};

  return _.map(players, (player) => {
    rank++;
    positionRanks[player.position] = (positionRanks[player.position] || 0) + 1;
    return {
      ...player,
      rank,
      positionRank: positionRanks[player.position],
    };
  });
};

const getRows = async (
  players: Player[],
  scoringSettings: ScoringSettings
): Promise<PlayerRow[]> => {
  const [projections, rankings] = await Promise.all([
    getPlayerProjections(),
    getOrInitRankings(players).then((rankings) =>
      _.keyBy(rankings, 'playerId')
    ),
  ]);

  console.log(projections[367]);
  console.log(
    scoreProjection({ id: 367, ...projections[367] }, scoringSettings)
  );

  const enriched = _(players)
    .map((player) => ({
      ...player,
      rank: rankings[player.id].rank,
      projection:
        scoreProjection(
          { id: player.id, ...projections[player.id] },
          scoringSettings
        ) || null,
    }))
    .sortBy('rank')
    .value() as PlayerRow[];

  return setRankEnumerated(enriched);
};

const onRowsChange = async (players: PlayerRow[]) => {
  const updated = setRankEnumerated(players);
  await updateRankings(updated);
  return updated;
};

export default function ADPTable({
  players,
  setIsScoringModalOpen,
}: {
  players: Player[];
  setIsScoringModalOpen: (open: boolean) => void;
}) {
  // TODO prolly can get this from elsewhere, like redux or parent
  const [scoringSettings, setScoringSettings] =
    useState<ScoringSettings | null>(null);

  useEffect(() => {
    async function fetch() {
      const fetchedSettings = await getScoringSettings();
      setScoringSettings(fetchedSettings);
    }
    fetch();
  }, []);

  const [rows, setRows] = useState<PlayerRow[]>([]);

  useEffect(() => {
    if (!!scoringSettings) {
      getRows(players, scoringSettings).then(setRows);
    }
  }, [players, scoringSettings]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className={'flex w-full justify-center text-white'}>
      <div className={'w-4/5'}>
        <DndTable
          // TODO I guess sorting needs to happen outside of the DndTable ...
          data={rows}
          columns={[
            { key: 'id', label: 'ID', sortable: 'asc' },
            { key: 'adp', label: 'ADP', sortable: 'asc' },
            {
              key: 'rank',
              label: 'Ranking',
              sortable: 'asc',
              renderCell: RankCell,
            },
            {
              key: 'name',
              label: 'Name',
              sortable: false,
              renderCell: PlayerCell,
            },
            { key: 'teamName', label: 'Team', sortable: false },
            { key: 'projection', label: 'Projected Points', sortable: 'asc' },
          ]}
          defaultSortConfig={{ key: 'rank', direction: 'asc' }}
          styleOptions={{
            tbody: 'divide-y divide-gray-700',
            row: 'hover:bg-gray-800',
          }}
          isDragAllowed={isDragAllowed}
          onRowsChange={onRowsChange}
        />
      </div>
    </div>
  );
}
