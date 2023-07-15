import {
  PassingSeason,
  ReceivingSeason,
  RushingSeason,
  TeamSeason,
} from '@prisma/client';

export const getPassCmp = (season: PassingSeason) =>
  (100 * season.cmp!) / season.att!;

export const getPassYpa = (season: PassingSeason) => season.yds! / season.att!;

export const getPassTdp = (season: PassingSeason) =>
  (100 * season.td!) / season.att!;

export const getRushYpc = (season: RushingSeason) => season.yds! / season.att!;

export const getRushTdp = (season: RushingSeason) =>
  (100 * season.td!) / season.att!;

export const getRecvCmp = (season: ReceivingSeason) =>
  (100 * season.rec!) / season.tgt!;

export const getRecvYpr = (season: ReceivingSeason) =>
  season.yds! / season.rec!;

export const getRecvTdp = (season: ReceivingSeason) =>
  (100 * season.td!) / season.rec!;

export const getLastSeasonPassShare = (
  passingSeason: PassingSeason[],
  teamSeason: TeamSeason
): Map<number, number> =>
  passingSeason.reduce((map, season) => {
    map.set(season.playerId, season.att! / teamSeason.passAtt!);
    return map;
  }, new Map());

export const getLastSeasonRushShare = (
  passingSeason: RushingSeason[],
  teamSeason: TeamSeason
): Map<number, number> =>
  passingSeason.reduce((map, season) => {
    map.set(season.playerId, season.att! / teamSeason.rushAtt!);
    return map;
  }, new Map());

export const getLastSeasonRecvShare = (
  passingSeason: ReceivingSeason[],
  teamSeason: TeamSeason
): Map<number, number> =>
  passingSeason.reduce((map, season) => {
    map.set(season.playerId, season.rec! / teamSeason.passAtt!);
    return map;
  }, new Map());
