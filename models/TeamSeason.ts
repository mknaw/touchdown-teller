import { TeamSeason as PrismaTeamSeason } from '@prisma/client';

export type TeamSeasonData = Pick<TeamSeason, 'passAtt' | 'rushAtt'>;

export default class TeamSeason {
  passAtt: number;
  rushAtt: number;

  constructor(props: TeamSeasonData) {
    this.passAtt = props.passAtt;
    this.rushAtt = props.rushAtt;
  }

  static fromPrisma(teamSeason: PrismaTeamSeason) {
    return new TeamSeason({
      passAtt: teamSeason.passAtt,
      rushAtt: teamSeason.rushAtt,
    });
  }
}
