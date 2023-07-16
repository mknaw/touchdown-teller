'use client';

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
  return <td>{`${prefix}${opponent}`}</td>;
}

interface ScheduleProps {
  teamKey: TeamKey;
  games: Game[];
}

export default function Schedule({ teamKey, games }: ScheduleProps) {
  const gameMap = new Map(games.map((g) => [g.week, g]));
  const weeks = [...Array(gameCount).keys()].map((i) => i + 1);
  return (
    <Box justifyContent='center' sx={{ display: 'flex', width: 1 }}>
      <table>
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
                return <td key={week}>BYE</td>;
              }
            })}
          </tr>
        </tbody>
      </table>
    </Box>
  );
}
