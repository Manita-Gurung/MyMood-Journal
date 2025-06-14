'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        config
    );
}

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js' &&
            file.indexOf('.test.js') === -1
        );
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Define associations
db.User.hasMany(db.Goal, { foreignKey: 'userId', onDelete: 'CASCADE' });
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 72db02b3a03ab3c6a2022097b1190c68374736be
db.User.hasMany(db.Journal, { foreignKey: 'userId', onDelete: 'CASCADE' });

// Goal associations
db.Goal.belongsTo(db.User, { foreignKey: 'userId' });
db.Journal.belongsTo(db.User, { foreignKey: 'userId' });
<<<<<<< HEAD
=======
=======

// Goal associations
db.Goal.belongsTo(db.User, { foreignKey: 'userId' });
>>>>>>> 4557a295b2d52c655573d57ab0d421088e3b2fdb
>>>>>>> 72db02b3a03ab3c6a2022097b1190c68374736be

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db; 