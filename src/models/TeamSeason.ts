import { TeamSeason as PrismaTeamSeason } from '@prisma/client';

import { TeamKey } from '@/constants';

export type TeamSeason = {
  teamName: TeamKey;
  passAtt: number;
  passCmp: number;
  passYds: number;
  passTds: number;
  rushAtt: number;
  rushYds: number;
  rushTds: number;
};

export const teamSeasonFromPrisma = (
  teamSeason: PrismaTeamSeason
): TeamSeason => ({
  teamName: teamSeason.teamName as TeamKey,
  passAtt: teamSeason.passAtt,
  passCmp: teamSeason.passCmp,
  passYds: teamSeason.passYds,
  passTds: teamSeason.passTds,
  rushAtt: teamSeason.rushAtt,
  rushYds: teamSeason.rushYds,
  rushTds: teamSeason.rushTds,
});
