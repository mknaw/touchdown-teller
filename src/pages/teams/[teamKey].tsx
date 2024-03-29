import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Table } from 'dexie';
import _ from 'lodash';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';

import {
  PassGame,
  Player,
  PrismaClient,
  RecvGame,
  RushGame,
} from '@prisma/client';

import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';

import Card from '@/components/Card';
import Schedule from '@/components/Schedule';
import { Position, StatType, TeamKey, currentYear } from '@/constants';
import { db } from '@/data/persistence';
import TeamSeasonsModal from '@/features/TeamSeasonsModal';
import PlayerGameLog from '@/features/teams/PlayerGameLog';
import PlayerPanel from '@/features/teams/PlayerPanel';
import TeamPanel from '@/features/teams/TeamPanel';
import {
  getPlayerPassAggregates,
  getPlayerPassGame,
  getPlayerRecvAggregates,
  getPlayerRecvGame,
  getPlayerRushAggregates,
  getPlayerRushGame,
  getTeam,
} from '@/features/teams/queries';
import {
  clampPlayerSeason,
  clampTeamSeason,
  ensureValid,
} from '@/features/teams/validation';
import {
  PassAggregate,
  PassSeason,
  RecvAggregate,
  RecvSeason,
  RushAggregate,
  RushSeason,
} from '@/models/PlayerSeason';
import TeamSeason from '@/models/TeamSeason';
import { AppState } from '@/store';
import {
  IdMap,
  PlayerSeason,
  PlayerSeasonConstructable,
  PlayerSeasonData,
  TeamWithExtras,
  createPlayerSeason,
} from '@/types';
import { getTeamName, makeIdMap, setOnClone } from '@/utils';

interface Params extends ParsedUrlQuery {
  teamKey: TeamKey;
}

// TODO have to 404 if not among these?
export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: Object.values(TeamKey).map((teamKey) => ({ params: { teamKey } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<
  {
    team: TeamWithExtras;
  },
  Params
> = async (context) => {
  const { teamKey } = context.params as Params;
  const prisma = new PrismaClient();
  const team = await getTeam(prisma, teamKey);
  const playerIds = _.map(team.players, 'id');
  const [
    passGames,
    recvGames,
    rushGames,
    passAggregates,
    recvAggregates,
    rushAggregates,
  ] = await Promise.all([
    getPlayerPassGame(prisma, playerIds),
    getPlayerRecvGame(prisma, playerIds),
    getPlayerRushGame(prisma, playerIds),
    getPlayerPassAggregates(prisma, teamKey, playerIds),
    getPlayerRecvAggregates(prisma, teamKey, playerIds),
    getPlayerRushAggregates(prisma, teamKey, playerIds),
  ]);

  return {
    props: {
      team,
      title: getTeamName(team.key as TeamKey),
      passGames,
      recvGames,
      rushGames,
      passAggregates,
      recvAggregates,
      rushAggregates,
    },
  };
};

export type Projection = {
  teamSeason: TeamSeason;
  passSeasons: PassSeason[];
  recvSeasons: RecvSeason[];
  rushSeasons: RushSeason[];
};

const getDataHandlers = <T extends PlayerSeason>(
  teamKey: TeamKey,
  playerSeasons: IdMap<T>,
  constructor: PlayerSeasonConstructable<T>,
  table: Table,
  toStoreData: (s: T) => PlayerSeasonData<T>,
  setSeason: Dispatch<SetStateAction<IdMap<T>>>,
  setValidationMessage: (message: string) => void
) => {
  const fetchedDataToMap = (data: PlayerSeasonData<T>[]): IdMap<T> =>
    new Map(
      data
        .map((d) => createPlayerSeason(constructor, d))
        .map((p) => [p.playerId, p])
    );

  const initSeasons = async () => {
    const data = await table.where('team').equals(teamKey).toArray();
    setSeason(fetchedDataToMap(data as PlayerSeasonData<T>[]));
  };

  const initSeason = (player: Player, projection: Projection) => {
    const lastSeason = playerSeasons.get(player.id);
    let season = lastSeason
      ? _.cloneDeep(lastSeason)
      : constructor.default(player, teamKey as TeamKey);
    season = ensureValid(season, projection);
    table
      .put(toStoreData(season), player.id)
      // TODO would prefer to render optimistically and resolve failure
      // but that could be more complicated... for later
      .then(() => updateSeason(season))
      .catch(alert);
  };

  const updateSeason = (season: T) => {
    setSeason((s: IdMap<T>) => setOnClone(s, season.playerId, season));
  };

  const persistSeason = (season: T, projection: Projection) => {
    const [updatedSeason, wasValid] = clampPlayerSeason(season, projection);
    if (!wasValid) {
      setValidationMessage(
        'Player projection limited in accordance with team total.'
      );
    }
    updateSeason(updatedSeason);
    table.update(season.playerId, toStoreData(updatedSeason));
  };

  const deleteSeason = (playerId: number) => {
    setSeason((season) => {
      season.delete(playerId);
      return season;
    });
    table.where('id').equals(playerId).delete();
  };

  return {
    initSeasons,
    initSeason,
    updateSeason,
    persistSeason,
    deleteSeason,
  };
};

export default function Page({
  team,
  passGames,
  recvGames,
  rushGames,
  passAggregates,
  recvAggregates,
  rushAggregates,
}: {
  team: TeamWithExtras;
  passGames: PassGame[];
  recvGames: RecvGame[];
  rushGames: RushGame[];
  passAggregates: PassAggregate[];
  recvAggregates: RecvAggregate[];
  rushAggregates: RushAggregate[];
}) {
  const statType = useSelector<AppState, StatType>(
    (state) => state.settings.statType
  );

  const [passSeasons, setPassSeasons] = useState<IdMap<PassSeason>>(new Map());
  const [recvSeasons, setRecvSeasons] = useState<IdMap<RecvSeason>>(new Map());
  const [rushSeasons, setRushSeasons] = useState<IdMap<RushSeason>>(new Map());

  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>(
    undefined
  );

  const [teamSeason, setTeamSeason] = useState<TeamSeason | null>(null);
  const lastSeason = team.seasons[0];
  if (!lastSeason) {
    return null; // Shouldn't happen.
  }
  useEffect(() => {
    async function fetch() {
      const teamProjectionData = await db.team.get(team.key as TeamKey);
      if (teamProjectionData) {
        setTeamSeason(new TeamSeason(teamProjectionData));
      } else {
        const newTeamSeason = TeamSeason.fromPrisma(lastSeason);
        setTeamSeason(newTeamSeason);
        db.team.add(newTeamSeason, team.key as TeamKey);
      }
    }
    fetch();
  }, [team]);

  const [playerSeasonValidationMessage, setPlayerSeasonValidationMessage] =
    useState('');
  const [teamSeasonValidationMessage, setTeamSeasonValidationMessage] =
    useState('');

  // TODO really embarrassing to WET this up...
  const playerPassSeasons = makeIdMap(
    _.map(_.groupBy(passAggregates, 'playerId'), (agg, playerId) => {
      return PassSeason.fromAggregate({
        playerId: parseInt(playerId),
        name: agg[0].name,
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
        att: _.sumBy(agg, 'att'),
        cmp: _.sumBy(agg, 'cmp'),
        yds: _.sumBy(agg, 'yds'),
        tds: _.sumBy(agg, 'tds'),
      });
    }),
    'playerId'
  );
  const passDataHandlers = getDataHandlers(
    team.key as TeamKey,
    playerPassSeasons,
    PassSeason,
    db.pass,
    (s: PassSeason) => s.toStoreData(),
    setPassSeasons,
    setPlayerSeasonValidationMessage
  );

  const playerRecvSeasons = makeIdMap(
    _.map(_.groupBy(recvAggregates, 'playerId'), (agg, playerId) => {
      return RecvSeason.fromAggregate({
        playerId: parseInt(playerId),
        name: agg[0].name,
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
        tgt: _.sumBy(agg, 'tgt'),
        rec: _.sumBy(agg, 'rec'),
        yds: _.sumBy(agg, 'yds'),
        tds: _.sumBy(agg, 'tds'),
      });
    }),
    'playerId'
  );
  const recvDataHandlers = getDataHandlers(
    team.key as TeamKey,
    playerRecvSeasons,
    RecvSeason,
    db.recv,
    (s: RecvSeason) => s.toStoreData(),
    setRecvSeasons,
    setPlayerSeasonValidationMessage
  );

  const playerRushSeasons = makeIdMap(
    _.map(_.groupBy(rushAggregates, 'playerId'), (agg, playerId) => {
      return RushSeason.fromAggregate({
        playerId: parseInt(playerId),
        name: agg[0].name,
        team: agg[0].team,
        gp: _.sumBy(agg, 'gp'),
        att: _.sumBy(agg, 'att'),
        yds: _.sumBy(agg, 'yds'),
        tds: _.sumBy(agg, 'tds'),
      });
    }),
    'playerId'
  );
  const rushDataHandlers = getDataHandlers(
    team.key as TeamKey,
    playerRushSeasons,
    RushSeason,
    db.rush,
    (s: RushSeason) => s.toStoreData(),
    setRushSeasons,
    setPlayerSeasonValidationMessage
  );

  useEffect(() => {
    const fetch = async () => {
      passDataHandlers.initSeasons();
      recvDataHandlers.initSeasons();
      rushDataHandlers.initSeasons();
    };
    fetch();
  }, [team]);

  const commonProps = {
    team,
    statType,
    selectedPlayer,
    setSelectedPlayer,
  };
  if (!teamSeason) {
    return null; // Shouldn't happen.
  }

  const projection = {
    teamSeason,
    passSeasons: [...passSeasons.values()],
    recvSeasons: [...recvSeasons.values()],
    rushSeasons: [...rushSeasons.values()],
  };

  const persistTeamSeason = () => {
    const [newTeamSeason, wasValid] = clampTeamSeason(projection);
    setTeamSeason(() => _.cloneDeep(newTeamSeason));

    if (wasValid) {
      db.team.update(team.key as TeamKey, newTeamSeason.toStoreData());
    } else {
      setTeamSeasonValidationMessage(
        'Team total limited in accordance with player projection total.'
      );
    }
  };

  const playerPanel = {
    [StatType.PASS]: (
      <PlayerPanel<PassSeason>
        {...commonProps}
        relevantPositions={[Position.QB]}
        seasons={passSeasons}
        pastSeasons={playerPassSeasons}
        initSeason={(p) => passDataHandlers.initSeason(p, projection)}
        updateSeason={passDataHandlers.updateSeason}
        persistSeason={(s) => passDataHandlers.persistSeason(s, projection)}
        deleteSeason={passDataHandlers.deleteSeason}
      />
    ),
    [StatType.RECV]: (
      <PlayerPanel<RecvSeason>
        {...commonProps}
        relevantPositions={[Position.WR, Position.TE, Position.RB]}
        seasons={recvSeasons}
        pastSeasons={playerRecvSeasons}
        initSeason={(p) => recvDataHandlers.initSeason(p, projection)}
        updateSeason={recvDataHandlers.updateSeason}
        persistSeason={(s) => recvDataHandlers.persistSeason(s, projection)}
        deleteSeason={recvDataHandlers.deleteSeason}
      />
    ),
    [StatType.RUSH]: (
      <PlayerPanel<RushSeason>
        {...commonProps}
        relevantPositions={[Position.RB, Position.QB, Position.WR]}
        seasons={rushSeasons}
        pastSeasons={playerRushSeasons}
        initSeason={(p) => rushDataHandlers.initSeason(p, projection)}
        updateSeason={rushDataHandlers.updateSeason}
        persistSeason={(s) => rushDataHandlers.persistSeason(s, projection)}
        deleteSeason={rushDataHandlers.deleteSeason}
      />
    ),
  }[statType];

  const games = selectedPlayer
    ? {
      [StatType.PASS]: _.filter(
        passGames,
        (g) => g.player_id == selectedPlayer.id
      ),
      [StatType.RECV]: _.filter(
        recvGames,
        (g) => g.player_id == selectedPlayer.id
      ),
      [StatType.RUSH]: _.filter(
        rushGames,
        (g) => g.player_id == selectedPlayer.id
      ),
    }[statType]
    : [];

  return (
    <div className={'flex h-full pb-5'}>
      <TeamSeasonsModal />
      <div className={'flex grid-cols-2 gap-8 h-full w-full'}>
        <div className={'h-full w-full'}>
          <Card className={'h-full flex-col justify-stretch relative'}>
            {playerPanel}
            <Snackbar
              sx={{ position: 'absolute' }}
              open={!!playerSeasonValidationMessage}
              autoHideDuration={3000}
              message={playerSeasonValidationMessage}
              onClose={() => setPlayerSeasonValidationMessage('')}
            />
          </Card>
        </div>
        <div className={'w-full h-full grid grid-flow-row grid-rows-3 gap-8'}>
          <Card className={'row-span-2 h-full relative flex flex-col'}>
            {teamSeason && team.seasons[0] && (
              <TeamPanel
                statType={statType}
                teamSeason={teamSeason}
                setTeamSeason={setTeamSeason}
                persistTeamSeason={persistTeamSeason}
                lastSeason={lastSeason}
                passSeasons={passSeasons}
                recvSeasons={recvSeasons}
                rushSeasons={rushSeasons}
                passAggregates={_.filter(
                  passAggregates,
                  (agg) => agg.team == team.key
                )}
                recvAggregates={_.filter(
                  recvAggregates,
                  (agg) => agg.team == team.key
                )}
                rushAggregates={_.filter(
                  rushAggregates,
                  (agg) => agg.team == team.key
                )}
              />
            )}
            <Snackbar
              sx={{ position: 'absolute' }}
              open={!!teamSeasonValidationMessage}
              autoHideDuration={3000}
              message={teamSeasonValidationMessage}
              onClose={() => setTeamSeasonValidationMessage('')}
            />
          </Card>
          <Card className={'h-full w-full'}>
            {games.length ? (
              <>
                <div className={'flex flex-col h-full'}>
                  <Typography className={'text-center text-2xl'}>
                    2022 Gamelog
                  </Typography>
                  <div className={'flex w-full h-full'}>
                    <PlayerGameLog className={'h-full w-full'} games={games} />
                  </div>
                </div>
              </>
            ) : (
              <div className={'flex flex-col h-full'}>
                <Typography className={'text-center text-2xl mb-5'}>
                  {`${currentYear} Schedule`}
                </Typography>
                <Schedule
                  teamKey={team.key as TeamKey}
                  games={[...team.awayGames, ...team.homeGames]}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
