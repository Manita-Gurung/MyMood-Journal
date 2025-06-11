'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Entries', 'fileId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Ensure fileId can be null
      references: {
        model: 'Files', // Assuming your Files table is named 'Files'
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Or 'CASCADE' or 'NO ACTION' depending on desired behavior
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert to NOT NULL if needed, but this might be the problematic state
    // Consider if mood entries should always have a null fileId
    // or if the column should truly be nullable for all entry types.
    await queryInterface.changeColumn('Entries', 'fileId', {
      type: Sequelize.INTEGER,
      allowNull: false, // This was likely the original problematic state for mood entries
      references: {
        model: 'Files',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Or appropriate action
    });
  }
};
