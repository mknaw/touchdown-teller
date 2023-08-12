import { useEffect, useState } from 'react';

import { useIndexedDBStore } from 'use-indexeddb';

import Dialog from '@/components/Dialog';
import { setupPersistence, teamStoreKey } from '@/data/persistence';
import StatsTable from '@/features/StatsTable';
import { TeamSeasonData } from '@/models/TeamSeason';
import TeamSeason from '@/models/TeamSeason';
import { getTeamName } from '@/utils';

export default ({ open, onClose }: { open: boolean; onClose: () => void }) => {
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
    <Dialog open={open} onClose={onClose} title={title}>
      <StatsTable headers={headers} data={serializedSeasons} />
    </Dialog>
  );
};
