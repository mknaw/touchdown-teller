import { PassingSeason, ReceivingSeason, RushingSeason } from '@prisma/client';

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
