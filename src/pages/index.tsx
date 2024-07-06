import { useState } from 'react';

import _ from 'lodash';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';

import { Player, PrismaClient } from '@prisma/client';

import Modal from '@/components/Modal';
import { getAllPlayers } from '@/data/ssr';
import ADPTable from '@/features/ADPTable';
import ScoringSettings from '@/features/ScoringSettings';

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

export default function Home({
  players,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);

  const closeScoringModal = () => setIsScoringModalOpen(false);

  return (
    <>
      <ScoringModal open={isScoringModalOpen} close={closeScoringModal} />
      <ADPTable
        players={players}
        setIsScoringModalOpen={setIsScoringModalOpen}
      />
    </>
  );
}
