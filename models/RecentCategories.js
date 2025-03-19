const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/connection");

class RecentCategories extends Model { }

RecentCategories.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cat_budget: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: "user", // Make sure this matches your User model name
                key: "id",
            },
        },
    },
    {
        sequelize,
        timestamps: false,
        freezeTableName: true,
        underscored: true,
        modelName: "recent_categories", // This should match the table name in your database
    }
);

module.exports = RecentCategories;
