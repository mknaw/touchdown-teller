import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import _ from 'lodash';
import useSWR from 'swr';

import { DataGrid } from '@mui/x-data-grid';

import Modal from '@/components/Modal';
import { lastYear } from '@/constants';
import { db } from '@/data/persistence';
import TeamSeason from '@/models/TeamSeason';
import { AppState } from '@/store';
import {
  TeamSeasonsModalState,
  TeamSeasonsModalType,
  toggleTeamSeasonsModal,
} from '@/store/appStateSlice';

/* Retrieve projections from local storage */
function useTeamProjections(open: boolean) {
  const [teamSeasons, setTeamSeasons] = useState<TeamSeason[]>([]);
  useEffect(() => {
    async function fetch() {
      const teamProjectionData = await db.team.toArray();
      setTeamSeasons(teamProjectionData.map((data) => new TeamSeason(data)));
    }
    fetch();
    // TODO seems wasteful to get these when we're closing the modal,
    // ought to be a better way.
  }, [open]);
  return teamSeasons.map((teamSeason) => ({
    teamName: teamSeason.teamName,
    passAttProj: teamSeason.passAtt.toFixed(0),
    passYdsProj: teamSeason.passYds.toFixed(0),
    passTdsProj: teamSeason.passTds.toFixed(0),
    rushAttProj: teamSeason.rushAtt.toFixed(0),
    rushYdsProj: teamSeason.rushYds.toFixed(0),
    rushTdsProj: teamSeason.rushTds.toFixed(0),
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
  const { open, type } = useSelector<AppState, TeamSeasonsModalState>(
    (state) => state.appState.teamSeasonsModalState
  );

  const columns = {
    [TeamSeasonsModalType.Pass]: [
      { field: 'teamName', headerName: 'Team', flex: 1 },
      { field: 'passAtt', headerName: `${lastYear} Pass Attempts`, flex: 2 },
      { field: 'passAttProj', headerName: 'Projected Pass Attempts', flex: 2 },
      { field: 'passYds', headerName: `${lastYear} Pass Yards`, flex: 2 },
      { field: 'passYdsProj', headerName: 'Projected Pass Yards', flex: 2 },
      { field: 'passTds', headerName: `${lastYear} Pass TDs`, flex: 2 },
      { field: 'passTdsProj', headerName: 'Projected Pass TDs', flex: 2 },
    ],
    [TeamSeasonsModalType.Rush]: [
      { field: 'teamName', headerName: 'Team', flex: 1 },
      { field: 'rushAtt', headerName: 'Rush Attempts', flex: 2 },
      { field: 'rushYds', headerName: 'Rush Yards', flex: 2 },
      { field: 'rushTds', headerName: 'Rush TDs', flex: 2 },
    ],
  }[type];

  const rows = Object.values(
    _.merge(
      _.keyBy(useTeamProjections(open), 'teamName'),
      _.keyBy(useTeamSeasons(), 'teamName')
    )
  );

  const dispatch = useDispatch();
  const onClose = () => dispatch(toggleTeamSeasonsModal());

  const title = {
    [TeamSeasonsModalType.Pass]: `${lastYear} and Projected Team Passing Stats`,
    [TeamSeasonsModalType.Rush]: `${lastYear} and Projected Team Rushing Stats`,
  }[type];

  return (
    <Modal open={open} onClose={onClose} title={title} classnames={'w-10/12'}>
      <>
        <DataGrid
          rows={rows}
          getRowId={(row) => row.teamName}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 12 },
            },
          }}
        />
      </>
    </Modal>
  );
};
