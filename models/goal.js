'use strict';

module.exports = (sequelize, DataTypes) => {
    class Goal extends sequelize.Sequelize.Model {}

    Goal.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'Goal',
        tableName: 'goals',
        timestamps: true
    });

    Goal.associate = function(models) {
        Goal.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return Goal;
}; 