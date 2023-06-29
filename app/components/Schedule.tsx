'use client';

import { TeamKey, gameCount } from '../types';
import { Game } from '@prisma/client';

import Box from '@mui/material/Box';

interface GameCellProps {
  team: TeamKey;
  game: Game;
}

function GameCell({ team, game }: GameCellProps) {
  const isAway = game.away == team;
  const prefix = isAway ? '@' : '';
  const opponent = isAway ? game.home : game.away;
  return <td>{`${prefix}${opponent}`}</td>;
}

interface ScheduleProps {
  team: TeamKey;
  games: Game[];
}

export default function Schedule({ team, games }: ScheduleProps) {
  const gameMap = new Map(games.map((g) => [g.week, g]));
  const weeks = [...Array(gameCount).keys()].map((i) => i + 1);
  return (
    <Box justifyContent="center" sx={{ display: 'flex', width: 1 }}>
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
                return <GameCell key={week} team={team} game={game} />;
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
