const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/connection");

class Goals extends Model { }

Goals.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        goal: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        goal_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        current_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: "user",
                key: "id",
            },
        },
    },
    {
        sequelize,
        timestamps: false,
        freezeTableName: true,
        underscored: true,
        modelName: "goals",
    }
);

module.exports = Goals;