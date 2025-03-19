const Goals = require("./Goals");
const Items = require("./Items");
const RecentPurchases = require("./RecentPurchases");
const Savings = require("./Savings");
const User = require("./User");
const RecentCategories = require("./RecentCategories");
const ItemsCategories = require("./ItemsCategories");


User.hasMany(Goals, {
    foreignKey: "user_id",
    onDelete: "CASCADE",
});

Goals.belongsTo(User, {
    foreignKey: "user_id",
});

User.hasMany(Items, {
    foreignKey: "user_id",
    onDelete: "CASCADE",
});

Items.belongsTo(User, {
    foreignKey: "user_id",
});

User.hasMany(RecentCategories, {
    foreignKey: "user_id",
    onDelete: "CASCADE",
});

User.hasMany(RecentPurchases, {
    foreignKey: "user_id",
    onDelete: "CASCADE",
});

User.hasMany(ItemsCategories, {
    foreignKey: "user_id",
    onDelete: "CASCADE",
});

RecentPurchases.belongsTo(User, {
    foreignKey: "user_id",
});

User.hasMany(Savings, {
    foreignKey: "user_id",
    onDelete: "CASCADE",
});

Savings.belongsTo(User, {
    foreignKey: "user_id",
});

module.exports = { Goals, Items, RecentPurchases, Savings, User, RecentCategories, ItemsCategories };