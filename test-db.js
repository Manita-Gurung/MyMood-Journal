require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mymood_journal', 'postgres', process.env.DB_PASSWORD, {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log
});

async function testDB() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

testDB(); 