module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Goals', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Goals', 'userId');
  }
};
