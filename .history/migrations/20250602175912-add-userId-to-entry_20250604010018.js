module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Entries', 'userId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      allowNull: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Entries', 'userId');
  },
};
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Entries', 'userId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      allowNull: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Entries', 'userId');
  },
};
