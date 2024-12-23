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
module.exports.storeRecipe = async (req, res) => {
    try {
        // Extract data from form
        const {
            title,
            description,
            "ingredient-name": ingredientNames,
            "ingredient-quantity": ingredientQuantities,
            "step-number": stepNumbers,
            "instruction-desc": instructionDescriptions,
        } = req.body;

        // Format ingredients array
        const ingredients = Array.isArray(ingredientNames)
            ? ingredientNames.map((name, index) => ({
                  name: name.trim(),
                  quantity: ingredientQuantities[index].trim(),
              }))
            : [{ name: ingredientNames.trim(), quantity: ingredientQuantities.trim() }];

        // Format instructions array
        const instructions = Array.isArray(stepNumbers)
            ? stepNumbers.map((stepNumber, index) => ({
                  stepNumber: parseInt(stepNumber, 10),
                  description: instructionDescriptions[index].trim(),
              }))
            : [
                  {
                      stepNumber: parseInt(stepNumbers, 10),
                      description: instructionDescriptions.trim(),
                  },
              ];

        console.log(req.file);

        // Create new Recipe object
        const recipe = new Recipe({
            title,
            description,
            author: res.locals.user._id, // Important: store the user as the author
            ingredients,
            instructions,
            image: req.file ? `/uploads/${req.file.filename}` : null,
        });

        // Save the recipe to the database
        await recipe.save();
        console.log(recipe);
        res.redirect("/"); // Redirect to the main page or recipe list after saving
    } catch (error) {
        console.error("Error saving recipe:", error);
        res.status(500).send("Failed to create recipe");
    }
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
