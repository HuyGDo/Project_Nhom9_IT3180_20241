//controllers/recipeController.js
const Recipe = require("../models/Recipe");
const fs = require("fs");
const path = require("path");
const notificationService = require("../services/notificationService");

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
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

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
            ingredients,
            instructions,
            image: req.file ? `/uploads/${req.file.filename}` : null,
        });

        // Save the recipe to the database
        await recipe.save();

        // Create notification for new recipe
        await notificationService.createNotification({
            type: "new_content",
            payload: {
                author: req.user, // The author of the recipe
                contentId: recipe._id,
                contentType: "Recipe",
            },
        });

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

// Add like functionality
module.exports.likeRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe.likes.includes(req.user._id)) {
            await Recipe.findByIdAndUpdate(req.params.id, {
                $push: { likes: req.user._id },
            });

            // Create notification directly
            await notificationService.createNotification({
                type: "like",
                payload: {
                    contentAuthorId: recipe.author,
                    interactingUser: req.user,
                    contentId: recipe._id,
                    contentType: "Recipe",
                },
            });
        }
        res.redirect("back");
    } catch (error) {
        console.error("Error liking recipe:", error);
        res.status(500).send("Failed to like recipe");
    }
};

// Add comment functionality
module.exports.addComment = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        const comment = {
            user_id: req.user._id,
            comments: req.body.comment,
            rating: req.body.rating,
        };

        await Recipe.findByIdAndUpdate(req.params.id, {
            $push: { reviews: comment },
        });

        // Create notification directly
        await notificationService.createNotification({
            type: "comment",
            payload: {
                contentAuthorId: recipe.author,
                interactingUser: req.user,
                contentId: recipe._id,
                contentType: "Recipe",
            },
        });

        res.redirect("back");
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).send("Failed to add comment");
    }
};
