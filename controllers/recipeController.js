//controllers/recipeController.js
const Recipe = require("../models/Recipe");

// [GET] /recipes/
module.exports.showRecipes = (req, res) => {
    Recipe.find()
        .lean()
        .then((recipes) => {
            res.render("recipes/recipe-browse", {
                layout: "default",
                title: "Browse Recipes",
                recipes,
            });
        })
        .catch((err) => {
            console.error(err); // Log the error for debugging
            res.render("default/404", {
                layout: "default-logined",
                title: "Page not found",
            });
        });
};

// [GET] /recipes/:slug
module.exports.showRecipeDetail = (req, res) => {
    Recipe.findOne({ slug: req.params.slug })
        .lean()
        .then((recipe) => {
            res.render("recipes/recipe-detail", {
                layout: "default",
                title: recipe.title,
                recipe,
            });
        })
        .catch((err) => {
            console.error(err); // Log the error for debugging
            res.render("default/404", {
                layout: "default-logined",
                title: "Page not found",
            });
        });
};

// [GET] /recipes/create
module.exports.createRecipe = (req, res) => {
    res.render("recipes/create", {
        layout: "default-logined",
        title: "Create Recipe",
    });
};

// [POST] /recipes/store
module.exports.storeRecipe = (req, res) => {
    // res.json(req.body);
    const formData = req.body;
    const recipe = new Recipe(formData);
    recipe
        .save()
        .then(() => res.redirect("/"))
        .catch((error) => {});
};

// [GET] /recipes/:id/edit
module.exports.editRecipe = (req, res, next) => {
    Recipe.findById(req.params.id)
        .lean()
        .then((recipe) => {
            res.render("recipes/edit", {
                layout: "default-logined",
                title: "Edit Recipe",
                recipe,
            });
        })
        .catch(next);
};

// [PUT] /recipes/:id
module.exports.updateRecipe = (req, res, next) => {
    Recipe.updateOne({ _id: req.params.id }, req.body)
        .then(() => res.redirect("/me/stored/recipes"))
        .catch(next);
};

// [DELETE] /recipes/:id
module.exports.deleteRecipe = (req, res, next) => {
    Recipe.deleteOne({ _id: req.params.id })
        .then(() => res.redirect("back"))
        .catch(next);
};
