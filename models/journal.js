module.exports = (sequelize, DataTypes) => {
    const Journal = sequelize.define('Journal', {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        mood: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    Journal.associate = (models) => {
        Journal.belongsTo(models.User, {
            foreignKey: {
                name: 'userId',
                allowNull: false
            },
            onDelete: 'CASCADE' // Add this line
        });
    };

    return Journal;
}; 