require('dotenv').config();

module.exports = {
  development: {
    username: 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'mymood_journal',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log
  },
  test: {
    username: 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'mymood_journal_test',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
}; 