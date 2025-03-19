const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/connection");

class ItemsCategories extends Model { }

ItemsCategories.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        category_name: {
            type: DataTypes.STRING,
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
        modelName: "items_categories",
    }
);

module.exports = ItemsCategories;