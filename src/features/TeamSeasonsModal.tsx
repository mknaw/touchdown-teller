import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useIndexedDBStore } from 'use-indexeddb';

import Modal from '@/components/Modal';
import { setupPersistence, teamStoreKey } from '@/data/persistence';
import StatsTable from '@/features/StatsTable';
import { TeamSeasonData } from '@/models/TeamSeason';
import TeamSeason from '@/models/TeamSeason';
import { AppState } from '@/store';
import { toggleTeamPassSeasonsModal } from '@/store/appStateSlice';
import { getTeamName } from '@/utils';

function useTeamProjections() {
  const [teamSeasons, setTeamSeasons] = useState<TeamSeason[]>([]);
  const teamStore = useIndexedDBStore<TeamSeasonData>(teamStoreKey);
  useEffect(() => {
    async function fetch() {
      await setupPersistence();
      const teamProjectionData = await teamStore.getAll();
      setTeamSeasons(teamProjectionData.map((data) => new TeamSeason(data)));
    }
    fetch();
  }, [teamStore]);
  return teamSeasons;
}

export default () => {
  const open = useSelector<AppState, boolean>(
    (state) => state.appState.isTeamPassSeasonsModalOpen
  );
  const dispatch = useDispatch();
  const onClose = () => dispatch(toggleTeamPassSeasonsModal());
  const teamSeasons = useTeamProjections();

  const headers = {
    teamName: 'Team',
    passAtt: 'Pass Attempts',
    passYds: 'Pass Yards',
    passTds: 'Pass TDs',
  } as Record<keyof TeamSeason, string>;

  const serializedSeasons = teamSeasons.map((teamSeason) => ({
    teamName: getTeamName(teamSeason.teamName),
    passAtt: teamSeason.passAtt.toFixed(0),
    passYds: teamSeason.passYds.toFixed(0),
    passTds: teamSeason.passTds.toFixed(0),
  }));

  const title = 'Team Passing Projections';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <StatsTable headers={headers} data={serializedSeasons} />
    </Modal>
  );
};
