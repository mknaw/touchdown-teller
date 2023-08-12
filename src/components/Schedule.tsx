import Link from 'next/link';

import { Game } from '@prisma/client';

import Box from '@mui/material/Box';

import { TeamKey, gameCount } from '@/constants';

interface GameCellProps {
  teamKey: TeamKey;
  game: Game;
}

function GameCell({ teamKey, game }: GameCellProps) {
  const isAway = game.awayName == teamKey;
  const prefix = isAway ? '@' : '';
  const opponent = isAway ? game.homeName : game.awayName;
  return (
    <td>
      <Link href={`/teams/${opponent}`}>{`${prefix}${opponent}`}</Link>
    </td>
  );
}

interface ScheduleProps {
  teamKey: TeamKey;
  games: Game[];
}

export default function Schedule({ teamKey, games }: ScheduleProps) {
  console.log(games);
  const gameMap = new Map(games.map((g) => [g.week, g]));
  const weeks = [...Array(gameCount).keys()].map((i) => i + 1);
  return (
    <Box className={'flex w-full justify-center'}>
      <table className={'w-full'}>
        <thead>
          <tr>
            {weeks.map((week) => (
              <th key={week}>{week}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {weeks.map((week) => {
              const game = gameMap.get(week);
              if (game) {
                return <GameCell key={week} teamKey={teamKey} game={game} />;
              } else {
                // TODO should get `gray` from theme...
                return (
                  <td key={week} className={'text-gray-500'}>
                    BYE
                  </td>
                );
              }
            })}
          </tr>
        </tbody>
      </table>
    </Box>
  );
}
