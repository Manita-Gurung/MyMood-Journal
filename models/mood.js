module.exports = (sequelize, DataTypes) => {
    const Mood = sequelize.define('Mood', {
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        mood: {
            type: DataTypes.STRING,
            allowNull: false
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    Mood.associate = (models) => {
        Mood.belongsTo(models.User, {
            foreignKey: {
                name: 'userId',
                allowNull: false
            }
        });
    };

    return Mood;
}; 