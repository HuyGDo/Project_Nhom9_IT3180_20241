const Recipe = require("../models/recipeModel");

// Controller function for rendering the recipe browse page
module.exports.show = async (req, res, next) => {
    Recipe.findOne({ slug: req.params.slug })
        .then((recipe) => {
            res.json(recipe);
        })
        .catch(next);
};
