import setupIndexedDB from 'use-indexeddb';

export const teamStoreKey = 'team';
export enum StorageKey {
  PASS = 'pass',
  RECV = 'recv',
  RUSH = 'rush',
}

const indexedDbConfig = {
  databaseName: 'touchdown-teller',
  version: 1,
  stores: [
    {
      name: teamStoreKey,
      // Keyed by `TeamKey`
      id: { autoIncrement: false },
      indices: [],
    },
    // TODO these probably should be programmatically generated from the enum iter
    {
      name: StorageKey.PASS,
      id: { autoIncrement: false },
      indices: [{ name: 'team', keyPath: 'team', options: { unique: false } }],
    },
    {
      name: StorageKey.RUSH,
      id: { autoIncrement: false },
      indices: [{ name: 'team', keyPath: 'team', options: { unique: false } }],
    },
    {
      name: StorageKey.RECV,
      id: { autoIncrement: false },
      indices: [{ name: 'team', keyPath: 'team', options: { unique: false } }],
    },
  ],
};

export const setupPersistence = async () => {
  setupIndexedDB(indexedDbConfig).catch((e) =>
    console.error('error / unsupported', e)
  );
};
