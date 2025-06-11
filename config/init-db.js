const { Sequelize } = require('sequelize');
const config = require('./database');

const sequelize = new Sequelize(
    'mymood_journal',
    'postgres',
    process.env.DB_PASSWORD,
    {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        logging: console.log
    }
);

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        // Sync database
        await sequelize.sync({ force: true });
        console.log('Database synchronized successfully.');
        
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

testConnection(); 