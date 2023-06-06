import setupIndexedDB from 'use-indexeddb';

export const teamStoreKey = 'team';
export const passShareKey = 'passing';
export const rushShareKey = 'rushing';
export const recShareKey = 'receiving';

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
                { name: "id", keyPath: "id", options: { unique: true } },
                { name: "team", keyPath: "team", options: { unique: false } },
            ],
        },
        {
            name: rushShareKey,
            id: { autoIncrement: false },
            indices: [
                { name: "id", keyPath: "id", options: { unique: true } },
                { name: "team", keyPath: "team", options: { unique: false } },
            ],
        },
        {
            name: recShareKey,
            id: { autoIncrement: false },
            indices: [
                { name: "id", keyPath: "id", options: { unique: true } },
                { name: "team", keyPath: "team", options: { unique: false } },
            ],
        },
    ],
};

export const setupPersistence = async () => {
    setupIndexedDB(indexedDbConfig).catch(e => console.error('error / unsupported', e));
};
