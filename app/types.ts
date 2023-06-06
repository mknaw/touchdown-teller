export enum TeamKey {
    ARI = 'ARI',
    ATL = 'ATL',
    BAL = 'BAL',
    BUF = 'BUF',
    CAR = 'CAR',
    CHI = 'CHI',
    CIN = 'CIN',
    CLE = 'CLE',
    DAL = 'DAL',
    DEN = 'DEN',
    DET = 'DET',
    GB = 'GB',
    HOU = 'HOU',
    IND = 'IND',
    JAX = 'JAX',
    KC = 'KC',
    LV = 'LV',
    LAC = 'LAC',
    LAR = 'LAR',
    MIA = 'MIA',
    MIN = 'MIN',
    NWE = 'NWE',
    NO = 'NO',
    NYG = 'NYG',
    NYJ = 'NYJ',
    PHI = 'PHI',
    PIT = 'PIT',
    SF = 'SF',
    SEA = 'SEA',
    TB = 'TB',
    TEN = 'TEN',
    WSH = 'WSH',
}

export enum Position {
    QB = 'QB',
    RB = 'RB',
    WR = 'WR',
    TE = 'TE',
}

export const gameCount = 17;

export type TeamProjectionData = Pick<TeamProjection, 'playsPerGame' | 'passRunRatio'>;

export class TeamProjection {
    playsPerGame: number;
    passRunRatio: number;

    constructor(props: TeamProjectionData) {
        this.playsPerGame = props.playsPerGame;
        this.passRunRatio = props.passRunRatio;
    }

    static default() {
        return new TeamProjection({
            playsPerGame: 65,
            passRunRatio: 50,
        });
    }

    attempts() {
        return this.playsPerGame * gameCount;
    }

    passAttempts() {
        return Math.floor(this.attempts() * (this.passRunRatio / 100));
    }

    rushAttempts() {
        return this.attempts() - this.passAttempts();
    }
}

// TODO might want to rename to Share or something
export interface Share {
    id: number,
    team: TeamKey,
    share: number,
}
