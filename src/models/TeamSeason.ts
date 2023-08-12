import { TeamSeason as PrismaTeamSeason } from '@prisma/client';

import { TeamKey } from '@/constants';

export type TeamSeasonData = Pick<
  TeamSeason,
  | 'teamName'
  | 'passAtt'
  | 'passCmp'
  | 'passYds'
  | 'passTds'
  | 'rushAtt'
  | 'rushYds'
  | 'rushTds'
>;

export default class TeamSeason {
  teamName: TeamKey;
  passAtt: number;
  passCmp: number;
  passYds: number;
  passTds: number;
  rushAtt: number;
  rushYds: number;
  rushTds: number;

  constructor(props: TeamSeasonData) {
    this.teamName = props.teamName;
    this.passAtt = props.passAtt;
    this.passCmp = props.passCmp;
    this.passYds = props.passYds;
    this.passTds = props.passTds;
    this.rushAtt = props.rushAtt;
    this.rushYds = props.rushYds;
    this.rushTds = props.rushTds;
  }

  static fromPrisma(teamSeason: PrismaTeamSeason) {
    return new TeamSeason({
      teamName: teamSeason.teamName as TeamKey,
      passAtt: teamSeason.passAtt,
      passCmp: teamSeason.passCmp,
      passYds: teamSeason.passYds,
      passTds: teamSeason.passTds,
      rushAtt: teamSeason.rushAtt,
      rushYds: teamSeason.rushYds,
      rushTds: teamSeason.rushTds,
    });
  }

  toStoreData(): TeamSeasonData {
    return {
      teamName: this.teamName,
      passAtt: this.passAtt,
      passCmp: this.passCmp,
      passYds: this.passYds,
      passTds: this.passTds,
      rushAtt: this.rushAtt,
      rushYds: this.rushYds,
      rushTds: this.rushTds,
    };
  }
}
