import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AnyAction } from '@reduxjs/toolkit';
import useSWR from 'swr';
import { useIndexedDBStore } from 'use-indexeddb';

import Modal from '@/components/Modal';
import { lastYear } from '@/constants';
import { setupPersistence, teamStoreKey } from '@/data/persistence';
import StatsTable from '@/features/StatsTable';
import { TeamSeasonData } from '@/models/TeamSeason';
import TeamSeason from '@/models/TeamSeason';
import { AppState } from '@/store';
import {
  toggleTeamPassSeasonsModal,
  toggleTeamRushSeasonsModal,
} from '@/store/appStateSlice';
import { getTeamName } from '@/utils';

function useTeamProjections(open: boolean) {
  const [teamSeasons, setTeamSeasons] = useState<TeamSeason[]>([]);
  const teamStore = useIndexedDBStore<TeamSeasonData>(teamStoreKey);
  useEffect(() => {
    async function fetch() {
      await setupPersistence();
      const teamProjectionData = await teamStore.getAll();
      setTeamSeasons(teamProjectionData.map((data) => new TeamSeason(data)));
    }
    fetch();
    // TODO seems wasteful to get these when we're closing the modal,
    // ought to be a better way.
  }, [teamStore, open]);
  return teamSeasons.map((teamSeason) => ({
    teamName: getTeamName(teamSeason.teamName),
    passAtt: teamSeason.passAtt.toFixed(0),
    passYds: teamSeason.passYds.toFixed(0),
    passTds: teamSeason.passTds.toFixed(0),
    rushAtt: teamSeason.rushAtt.toFixed(0),
    rushYds: teamSeason.rushYds.toFixed(0),
    rushTds: teamSeason.rushTds.toFixed(0),
  }));
}

/* Display a comparison of all team aggregate stats or projections over a season */
function TeamSeasonModal<T>({
  open,
  toggle,
  title,
  headers,
  data,
}: {
  open: boolean;
  toggle: () => AnyAction;
  title: string;
  headers: Record<keyof T, string>;
  data: T[];
}) {
  const dispatch = useDispatch();
  const onClose = () => dispatch(toggle());

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <StatsTable headers={headers} data={data} />
    </Modal>
  );
}

export const TeamPassSeasonsModal = () => {
  const open = useSelector<AppState, boolean>(
    (state) => state.appState.isTeamPassSeasonsModalOpen
  );

  const headers = {
    teamName: 'Team',
    passAtt: 'Pass Attempts',
    passYds: 'Pass Yards',
    passTds: 'Pass TDs',
  } as Record<keyof TeamSeason, string>;

  const data = useTeamProjections(open);

  return (
    <TeamSeasonModal
      open={open}
      toggle={toggleTeamPassSeasonsModal}
      title={'Team Passing Projections'}
      headers={headers}
      data={data}
    />
  );
};

export const TeamRushSeasonsModal = () => {
  const open = useSelector<AppState, boolean>(
    (state) => state.appState.isTeamRushSeasonsModalOpen
  );

  const headers = {
    teamName: 'Team',
    rushAtt: 'Rush Attempts',
    rushYds: 'Rush Yards',
    rushTds: 'Rush TDs',
  } as Record<keyof TeamSeason, string>;

  const data = useTeamProjections(open);

  return (
    <TeamSeasonModal
      open={open}
      toggle={toggleTeamRushSeasonsModal}
      title={'Team Rushing Projections'}
      headers={headers}
      data={data}
    />
  );
};

export const TeamLastPassSeasonsModal = () => {
  const open = useSelector<AppState, boolean>(
    (state) => state.appState.isTeamPassSeasonsModalOpen
  );
  const headers = {
    teamName: 'Team',
    passAtt: 'Pass Attempts',
    passYds: 'Pass Yards',
    passTds: 'Pass TDs',
  } as Record<keyof TeamSeason, string>;

  // TODO probably better for the api to take the year as a param
  // but not super important for now
  const { data } = useSWR('/api/teamSeasons', (url) =>
    fetch(url).then((res) => res.json())
  );

  return (
    <TeamSeasonModal
      open={open}
      toggle={toggleTeamPassSeasonsModal}
      title={`${lastYear} Team Passing Stats`}
      headers={headers}
      data={data}
    />
  );
};
