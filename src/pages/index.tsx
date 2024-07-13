import { useEffect, useState } from 'react';

import _ from 'lodash';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';

import { Player, PrismaClient } from '@prisma/client';

import Modal from '@/components/Modal';
import { getAllPlayers } from '@/data/ssr';
import ADPTable from '@/features/ADPTable';
import ScoringSettings from '@/features/ScoringSettings';
import { Ranking, getRankings, initializeRankings } from '@/models/Ranking';

const ScoringModal = ({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) => (
  <Modal open={open} onClose={close} title={'Scoring settings'}>
    <ScoringSettings />
  </Modal>
);

function mergeRanks(
  rankData: Ranking[],
  playerData: Player[]
): (Player & Pick<Ranking, 'rank'>)[] {
  // First, create a map of playerId to rank for easier lookup
  const rankMap = _.keyBy(rankData, 'playerId');

  // Now merge the data
  const mergedData = playerData.map((player) => ({
    ...player,
    rank: rankMap[player.id].rank,
  }));

  return mergedData;
}

async function getOrInitRankings(players: Player[]) {
  let rankings = await getRankings();

  // TODO here we probably ought to do some self-healing, corrective checks...
  if (rankings.length === 0) {
    await initializeRankings(players);
    rankings = await getRankings();
  }
  return rankings;
}

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
  const [enrichedPlayers, setEnrichedPlayers] = useState<
    (Player & Pick<Ranking, 'rank'>)[] | null
  >(null);

  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const closeScoringModal = () => setIsScoringModalOpen(false);

  useEffect(() => {
    async function fetchAndInitializeRankings() {
      let rankings = await getOrInitRankings(players);
      // TODO also enrich with scoring.
      setEnrichedPlayers(mergeRanks(rankings, players));
    }

    fetchAndInitializeRankings();
  }, []);

  if (!enrichedPlayers) {
    return null;
  }

  return (
    <>
      <ScoringModal open={isScoringModalOpen} close={closeScoringModal} />
      <ADPTable
        players={enrichedPlayers}
        setIsScoringModalOpen={setIsScoringModalOpen}
      />
    </>
  );
}
