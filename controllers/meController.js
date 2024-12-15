//controllers/meController.js
const Recipe = require("../models/Recipe");

// [GET] /me
module.exports.showUserInfo = (req, res) => {
    const user = res.locals.user; // Assumes checkUser middleware sets res.locals.user
    console.log("showUserInfo - User:", user);
    res.render("me/user-info", {
        layout: "default-logined",
        title: "My Profile",
        user,
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
