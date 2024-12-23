//controllers/meController.js
const Recipe = require("../models/Recipe");
const User = require("../models/User");
// [GET] /me
module.exports.showUserInfo = async (req, res) => {
    try {
        // Load user with followers
        const user = await User.findById(res.locals.user._id).populate("followers").lean();
        const followerCount = user.followers.length;

        // Load recipes authored by this user
        const myRecipes = await Recipe.find({ author: user._id }).lean();

        res.render("me/user-info", {
            layout: "default-logined",
            title: "My Profile",
            user,
            followerCount,
            myRecipes,
        });
    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).send("Error fetching user info");
    }
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
