'use client';

import React, { useEffect } from 'react';
import setupIndexedDB, { useIndexedDBStore } from 'use-indexeddb';

// Database Configuration
const idbConfig = {
    databaseName: 'fruity-db3',
    version: 1,
    stores: [
        {
            name: 'fruits',
            id: { autoIncrement: false },
            indices: [
                { name: 'name', keyPath: 'name', options: { unique: false } },
                { name: 'quantity', keyPath: 'quantity' },
            ],
        },
    ],
};

const Example = () => {
    useEffect(() => {
        setupIndexedDB(idbConfig)
            .then(() => console.log('success'))
            .catch(e => console.error('error / unsupported', e));
    }, []);

    const { add } = useIndexedDBStore('fruits');

    const insertFruit = () => {
        add({ name: 'Mango 🥭', quantity: 2 }, 'foo').then(console.log);
    };

    const { getByID } = useIndexedDBStore("fruits");
    const clickGet = () => {
        getByID('foo').then(console.log).catch(console.error);
    };

    return (
        <>
            <button onClick={insertFruit}>Insert</button>
            <button onClick={clickGet}>get</button>
        </>
    );
};

export default Example;
