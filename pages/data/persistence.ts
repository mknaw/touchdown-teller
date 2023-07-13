import setupIndexedDB from 'use-indexeddb';

export const teamStoreKey = 'team';
export enum StorageKey {
  PASS = 'passing',
  RECV = 'receiving',
  RUSH = 'rushing',
}

export const passShareKey = StorageKey.PASS;
export const rushShareKey = StorageKey.RUSH;
export const recvShareKey = StorageKey.RECV;
export const passProjectionKey = 'pass-projection';
export const rushProjectionKey = 'rush-projection';
export const recvProjectionKey = 'recv-projection';

const indexedDbConfig = {
  databaseName: 'projection-app',
  version: 1,
  stores: [
    {
      name: teamStoreKey,
      // Keyed by `TeamKey`
      id: { autoIncrement: false },
      indices: [],
    },
    {
      name: passShareKey,
      id: { autoIncrement: false },
      indices: [
        { name: 'id', keyPath: 'id', options: { unique: true } },
        { name: 'team', keyPath: 'team', options: { unique: false } },
      ],
    },
    {
      name: rushShareKey,
      id: { autoIncrement: false },
      indices: [
        { name: 'id', keyPath: 'id', options: { unique: true } },
        { name: 'team', keyPath: 'team', options: { unique: false } },
      ],
    },
    {
      name: recvShareKey,
      id: { autoIncrement: false },
      indices: [
        { name: 'id', keyPath: 'id', options: { unique: true } },
        { name: 'team', keyPath: 'team', options: { unique: false } },
      ],
    },
    {
      name: passProjectionKey,
      id: { autoIncrement: false },
      indices: [],
    },
    {
      name: rushProjectionKey,
      id: { autoIncrement: false },
      indices: [],
    },
    {
      name: recvProjectionKey,
      id: { autoIncrement: false },
      indices: [],
    },
  ],
};

export const setupPersistence = async () => {
  setupIndexedDB(indexedDbConfig).catch((e) =>
    console.error('error / unsupported', e)
  );
};
