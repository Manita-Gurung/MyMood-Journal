const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            set(value) {
                // Hash password before saving
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(value, salt);
                this.setDataValue('password', hash);
            }
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 13,
                max: 120
            }
        }
    });

    User.associate = function(models) {
        User.hasMany(models.Entry, {
            onDelete: 'CASCADE'
        });
    };

    // Method to check password
    User.prototype.checkPassword = function(password) {
        return bcrypt.compareSync(password, this.getDataValue('password'));
    };

    return User;
}; 