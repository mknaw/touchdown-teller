import { TeamKey } from 'app/types';

export function getTeamName(teamKey: TeamKey): string {
  const teams: Record<TeamKey, string> = {
    ARI: 'Arizona Cardinals',
    ATL: 'Atlanta Falcons',
    BAL: 'Baltimore Ravens',
    BUF: 'Buffalo Bills',
    CAR: 'Carolina Panthers',
    CHI: 'Chicago Bears',
    CIN: 'Cincinnati Bengals',
    CLE: 'Cleveland Browns',
    DAL: 'Dallas Cowboys',
    DEN: 'Denver Broncos',
    DET: 'Detroit Lions',
    GB: 'Green Bay Packers',
    HOU: 'Houston Texans',
    IND: 'Indianapolis Colts',
    JAX: 'Jacksonville Jaguars',
    KC: 'Kansas City Chiefs',
    LV: 'Las Vegas Raiders',
    LAC: 'Los Angeles Chargers',
    LAR: 'Los Angeles Rams',
    MIA: 'Miami Dolphins',
    MIN: 'Minnesota Vikings',
    NWE: 'New England Patriots',
    NO: 'New Orleans Saints',
    NYG: 'New York Giants',
    NYJ: 'New York Jets',
    PHI: 'Philadelphia Eagles',
    PIT: 'Pittsburgh Steelers',
    SF: 'San Francisco 49ers',
    SEA: 'Seattle Seahawks',
    TB: 'Tampa Bay Buccaneers',
    TEN: 'Tennessee Titans',
    WSH: 'Washington Commanders',
  };
  return teams[teamKey];
}

export function setOnClone<K, V>(map: Map<K, V>, key: K, value: V): Map<K, V> {
  const clone = new Map(map);
  clone.set(key, value);
  return clone;
}
