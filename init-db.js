'use strict';

const { Client } = require('pg');

async function initializeDatabase() {
    const client = new Client({
        user: 'postgres',
        password: 'manita@2003',
        host: 'localhost',
        port: 5432,
    });

    try {
        // Connect to PostgreSQL
        await client.connect();
        console.log('Connected to PostgreSQL');

        // Drop database if exists
        await client.query(`
            DROP DATABASE IF EXISTS mymood_journal;
        `);
        console.log('Dropped existing database if it existed');

        // Create database
        await client.query(`
            CREATE DATABASE mymood_journal;
        `);
        console.log('Created fresh database');

        // Disconnect from PostgreSQL
        await client.end();
        console.log('Setup completed successfully');

    } catch (error) {
        console.error('Error during database initialization:', error);
        if (client) {
            await client.end();
        }
        process.exit(1);
    }
}

initializeDatabase(); 