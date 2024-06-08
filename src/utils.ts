import { TeamKey } from '@/constants';

export function setOnClone<K, V>(map: Map<K, V>, key: K, value: V): Map<K, V> {
  const clone = new Map(map);
  clone.set(key, value);
  return clone;
}

export function mapMap<K, V, R>(
  originalMap: Map<K, V>,
  fn: (value: V) => R
): Map<K, R> {
  const result = new Map<K, R>();
  for (const [key, value] of originalMap.entries()) {
    result.set(key, fn(value));
  }
  return result;
}

export function makeIdMap<T>(items: T[], idKey: keyof T): Map<number, T> {
  return new Map(items.map((item) => [item[idKey] as number, item]));
}

export function toEnumValue(enumType: any, value: string): any {
    return enumType[value as keyof typeof enumType];
}

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
