import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import useSWR from 'swr';
import { useIndexedDBStore } from 'use-indexeddb';

import { Switch } from '@mui/material';

import Modal from '@/components/Modal';
import { setupPersistence, teamStoreKey } from '@/data/persistence';
import StatsTable from '@/features/StatsTable';
import { TeamSeasonData } from '@/models/TeamSeason';
import TeamSeason from '@/models/TeamSeason';
import { AppState } from '@/store';
import {
  TeamSeasonsModalState,
  TeamSeasonsModalType,
  toggleTeamSeasonsModal,
  toggleTeamSeasonsModalYear,
} from '@/store/appStateSlice';
import { getTeamName } from '@/utils';

/* Retrieve projections from local storage */
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

/* Retrieve projections from hardcoded past historical stats */
function useTeamSeasons() {
  const { data } = useSWR('/api/teamSeasons', (url) =>
    fetch(url).then((res) => res.json())
  );
  return data;
}

/* Display a comparison of all team aggregate stats or projections over a season */
export default () => {
  const { open, type, year } = useSelector<AppState, TeamSeasonsModalState>(
    (state) => state.appState.teamSeasonsModalState
  );

  // TODO I think using both here is a smell.
  // maybe should be separate components after all.
  const projections = useTeamProjections(open);
  const teamSeasons = useTeamSeasons();
  let data, title;
  const showProjections = year === null;
  if (showProjections) {
    data = projections;
    title = {
      [TeamSeasonsModalType.Pass]: 'Team Passing Projections',
      [TeamSeasonsModalType.Rush]: 'Team Rushing Projections',
    }[type];
  } else {
    data = teamSeasons;
    title = {
      [TeamSeasonsModalType.Pass]: `${year} Team Passing Stats`,
      [TeamSeasonsModalType.Rush]: `${year} Team Rushing Stats`,
    }[type];
  }

  const headers = {
    [TeamSeasonsModalType.Pass]: {
      teamName: 'Team',
      passAtt: 'Pass Attempts',
      passYds: 'Pass Yards',
      passTds: 'Pass TDs',
    },
    [TeamSeasonsModalType.Rush]: {
      teamName: 'Team',
      rushAtt: 'Rush Attempts',
      rushYds: 'Rush Yards',
      rushTds: 'Rush TDs',
    },
  }[type];

  const dispatch = useDispatch();
  const onClose = () => dispatch(toggleTeamSeasonsModal());
  const onTypeChange = () => dispatch(toggleTeamSeasonsModalYear());

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <>
        <Switch checked={showProjections} onChange={onTypeChange} />
        <StatsTable headers={headers} data={data} />
      </>
    </Modal>
  );
};
