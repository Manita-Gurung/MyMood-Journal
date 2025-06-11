'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Entries', 'mood', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await queryInterface.addColumn('Entries', 'userId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        });

        // Make fileId nullable
        await queryInterface.changeColumn('Entries', 'fileId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Files',
                key: 'id'
            },
            onDelete: 'CASCADE'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Entries', 'mood');
        await queryInterface.removeColumn('Entries', 'userId');
        await queryInterface.changeColumn('Entries', 'fileId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'Files',
                key: 'id'
            },
            onDelete: 'CASCADE'
        });
    }
}; 