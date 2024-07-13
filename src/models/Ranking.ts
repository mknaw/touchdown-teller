import _ from 'lodash';

import { Player } from '@prisma/client';

import { db } from '@/data/client';

export interface Ranking {
  playerId: number;
  rank: number;
}

/// Fetch the scoring settings from the DB.
export const getRankings = async (): Promise<Ranking[]> =>
  db.ranking.toArray({ includeKeys: true });

export async function initializeRankings(players: Player[]) {
  await db.transaction('rw', db.ranking, async () => {
    await db.ranking.clear();

    for (const player of players) {
      await db.ranking.add(
        {
          playerId: player.id,
          // TODO make player.adp non nullable
          rank: player.adp,
        },
        player.id
      );
    }
  });
}

// Actually this way is probably more efficient, but I'm not sure if it's worth the complexity
// for what is ultimately a couple hundred records to update.
// export async function updateRanking(playerId: number, newRank: number) {
//   await db.transaction('rw', db.ranking, async () => {
//     const draggedElement = await db.ranking.get(playerId);
//     if (!draggedElement) return;
//
//     const oldRank = draggedElement.rank;
//
//     if (newRank > oldRank) {
//       // Moving down the list
//       await db.ranking
//         .where('rank')
//         .between(oldRank + 1, newRank, true, true)
//         .modify((element) => {
//           element.rank--;
//         });
//     } else if (newRank < oldRank) {
//       // Moving up the list
//       await db.ranking
//         .where('rank')
//         .between(newRank, oldRank - 1, true, true)
//         .modify((element) => {
//           element.rank++;
//         });
//     }
//
//     // Update the dragged element's rank
//     await db.ranking.update(playerId, { rank: newRank });
//   });
// }

export const updateRankings = async (players: { id: number; rank: number }[]) =>
  db.ranking.bulkUpdate(
    _.map(players, ({ id, rank }) => ({ key: id, changes: { rank } }))
  );
