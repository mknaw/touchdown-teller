import { TeamSeason as PrismaTeamSeason } from '@prisma/client';

export type TeamSeasonData = Pick<
  TeamSeason,
  | 'passAtt'
  | 'passCmp'
  | 'passYds'
  | 'passTds'
  | 'rushAtt'
  | 'rushYds'
  | 'rushTds'
>;

export default class TeamSeason {
  passAtt: number;
  passCmp: number;
  passYds: number;
  passTds: number;
  rushAtt: number;
  rushYds: number;
  rushTds: number;

  constructor(props: TeamSeasonData) {
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
