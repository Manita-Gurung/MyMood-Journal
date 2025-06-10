'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Delete all records from the Users table
    await queryInterface.bulkDelete('Users', null, {
      truncate: true,
      cascade: true,
      restartIdentity: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Nothing to do in down migration since we can't restore deleted users
  }
}; 