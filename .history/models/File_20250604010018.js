module.exports = (sequelize, DataTypes) => {
    const File = sequelize.define('File', {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        folderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Folders',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    });

    File.associate = function(models) {
        File.belongsTo(models.Folder, {
            foreignKey: 'folderId',
            onDelete: 'CASCADE'
        });

        File.belongsTo(models.User, {
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });

        File.hasOne(models.Entry, {
            foreignKey: 'fileId',
            as: 'entry'
        });
    };

    return File;
};
