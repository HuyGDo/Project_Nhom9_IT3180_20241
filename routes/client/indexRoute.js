const express = require("express");
const router = express.Router();
const homeRoutes = require("./homeRoute");
const recipeRoutes = require("./recipeRoute");

module.exports = (app) => {
    app.use("/", homeRoutes);
    app.use("/recipes", recipeRoutes);
};
