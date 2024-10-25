const Recipe = require("../models/Recipe");

// [GET] /me
module.exports.showUserInfo = (req, res, next) => {
    res.render("me/user-info", {
        layout: "default-logined",
        title: "User Info",
    });
};

// [GET] /me/stored/recipes
module.exports.showStoredRecipes = (req, res, next) => {
    Recipe.find()
        .lean()
        .then((recipes) => {
            res.render("me/stored-recipes", {
                layout: "default-logined",
                title: "My Recipes",
                recipes,
            });
        })
        .catch(next);
};
