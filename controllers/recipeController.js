const Recipe = require("../models/Recipe");
const fs = require("fs");
const path = require("path");
const notificationService = require("../services/notificationService");
// const recommendationService = require('../services/recommendationService');
const { uploadRecipeImage } = require("../services/uploadService");

// [GET] /recipes/
module.exports.showRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate("author", "username first_name last_name profile_picture")
            .lean();

        console.log("Recipes with populated authors:", recipes);

        res.render("recipes/recipe-browse", {
            layout: "default",
            title: "Browse Recipes",
            recipes,
        });
    } catch (err) {
        console.error(err);
        res.render("default/404", {
            layout: "default",
            title: "Page not found",
        });
    }
};

// [GET] /recipes/:slug
module.exports.showRecipeDetail = async (req, res) => {
    try {
        // First find the recipe
        const recipe = await Recipe.findOne({ slug: req.params.slug })
            .populate("author", "username first_name last_name profile_picture")
            .lean();

        if (!recipe) {
            return res.render("default/404");
        }

        // Add userVoted info if user is logged in
        if (req.user) {
            const userVote = recipe.userVotes.find(
                (vote) => vote.user.toString() === req.user._id.toString(),
            );
            recipe.userVoted = {
                up: userVote?.voteType === "up",
                down: userVote?.voteType === "down",
            };
        }

        // Increment view count in a separate query
        await Recipe.findByIdAndUpdate(recipe._id, { $inc: { views: 1 } });

        // Get recommendations
        let recommendedRecipes = [];
        try {
            const recommendations = await recommendationService.getRecommendations(recipe._id);
            if (recommendations && recommendations.length > 0) {
                recommendedRecipes = await Recipe.find({
                    _id: { $in: recommendations },
                })
                    .select("title image votes slug")
                    .lean();
            } else {
                recommendedRecipes = await Recipe.find({
                    _id: { $ne: recipe._id },
                })
                    .select("title image votes slug")
                    .limit(5)
                    .lean();
            }
        } catch (error) {
            console.log("Error getting recommendations:", error.message);
            recommendedRecipes = await Recipe.find({
                _id: { $ne: recipe._id },
            })
                .select("title image votes slug")
                .limit(5)
                .lean();
        }

        res.render("recipes/recipe-detail", {
            layout: "default",
            title: recipe.title,
            recipe,
            recommendations: recommendedRecipes,
        });
    } catch (err) {
        console.error("Error in showRecipeDetail:", err);
        res.render("default/404");
    }
};

// [GET] /recipes/recipe-create
module.exports.createRecipe = (req, res) => {
    res.render("recipes/recipe-create", {
        layout: "default",
        title: "Create Recipe",
    });
};

module.exports.storeRecipe = async (req, res) => {
    try {
        // Format ingredients array
        const ingredients = Array.isArray(req.body.ingredients)
            ? req.body.ingredients
            : [req.body.ingredients];

        // Format instructions array
        const instructions = Array.isArray(req.body.instructions)
            ? req.body.instructions
                  .filter((instruction) => instruction && instruction.description)
                  .map((instruction) => ({
                      description: instruction.description,
                  }))
            : [{ description: req.body.instructions.description }];

        const formData = {
            author: req.user._id,
            title: req.body.title,
            description: req.body.description,
            prepTime: parseInt(req.body.prepTime),
            cookTime: parseInt(req.body.cookTime),
            servings: parseInt(req.body.servings),
            ingredients: ingredients,
            instructions: instructions,
        };

        if (req.file) {
            formData.image = `/uploads/recipes/${req.file.filename}`;
        }

        // Create and save recipe
        const recipe = new Recipe(formData);
        await recipe.save();

        console.log("Recipe created:", {
            id: recipe._id,
            title: recipe.title,
            author: req.user._id,
        });

        // Populate author data after saving
        await recipe.populate("author", "username first_name last_name profile_picture");

        console.log("Recipe with populated author:", recipe);

        // Create notifications for followers
        await notificationService.createNewContentNotification(
            req.user,
            recipe._id,
            "Recipe",
            recipe.title,
        );

        res.redirect("/recipes/" + recipe.slug);
    } catch (error) {
        console.error("Error saving recipe:", error);
        res.status(500).render("recipes/recipe-create", {
            layout: "default",
            title: "Create Recipe",
            error: "Failed to create recipe",
            formData: req.body,
        });
    }
};

// [GET] /recipes/:id/edit
module.exports.editRecipe = (req, res, next) => {
    Recipe.findById(req.params.id)
        .lean()
        .then((recipe) => {
            res.render("recipes/recipe-edit", {
                layout: "default",
                title: "Edit Recipe",
                recipe,
            });
        })
        .catch(next);
};

// [PUT] /recipes/:id
module.exports.updateRecipe = async (req, res) => {
    try {
        const recipeId = req.params.id;
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            prepTime: req.body.prepTime,
            cookTime: req.body.cookTime,
            servings: req.body.servings,
            ingredients: [],
            instructions: [],
        };

        // Handle ingredients
        if (req.body.ingredients) {
            const ingredients = Array.isArray(req.body.ingredients)
                ? req.body.ingredients
                : Object.values(req.body.ingredients);

            updateData.ingredients = ingredients.map((ing) => ({
                name: ing.name,
                quantity: ing.quantity,
            }));
        }

        // Handle instructions
        if (req.body.instructions) {
            const instructions = Array.isArray(req.body.instructions)
                ? req.body.instructions
                : Object.values(req.body.instructions);

            updateData.instructions = instructions.map((inst) => ({
                description: inst.description,
            }));
        }

        // Handle image upload
        if (req.file) {
            updateData.image = "/uploads/recipes/" + req.file.filename;
        }

        const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedRecipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        res.status(200).json({
            success: true,
            message: "Recipe updated successfully",
            recipe: updatedRecipe,
        });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({
            message: "Error updating recipe",
            error: error.message,
        });
    }
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

            // Create notification if the liker is not the author
            if (req.user._id.toString() !== recipe.author.toString()) {
                await notificationService.createLikeNotification(req.user, recipe, "Recipe");
            }
        }
        res.redirect("back");
    } catch (error) {
        console.error("Like error:", error);
        res.status(500).json({ error: "Failed to like recipe" });
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

        // Create notification if commenter is not the author
        if (req.user._id.toString() !== recipe.author.toString()) {
            await notificationService.createCommentNotification(req.user, recipe, "Recipe");
        }

        res.redirect("back");
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).send("Failed to add comment");
    }
};
// [POST] /recipes/:id/vote
module.exports.handleVote = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const userId = req.user._id;

        const recipe = await Recipe.findById(id);
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        const existingVoteIndex = recipe.userVotes.findIndex(
            (vote) => vote.user.toString() === userId.toString(),
        );

        if (existingVoteIndex > -1) {
            const existingVote = recipe.userVotes[existingVoteIndex];
            if (existingVote.voteType === voteType) {
                recipe.userVotes.splice(existingVoteIndex, 1);
                recipe.votes[`${voteType}votes`]--;
            } else {
                recipe.votes[`${existingVote.voteType}votes`]--;
                recipe.votes[`${voteType}votes`]++;
                existingVote.voteType = voteType;
            }
        } else {
            recipe.userVotes.push({ user: userId, voteType });
            recipe.votes[`${voteType}votes`]++;
        }

        recipe.votes.score = recipe.votes.upvotes - recipe.votes.downvotes;
        await recipe.save();

        res.json({
            success: true,
            upvotes: recipe.votes.upvotes,
            downvotes: recipe.votes.downvotes,
            userVoted: {
                up: recipe.userVotes.some(
                    (vote) => vote.user.toString() === userId.toString() && vote.voteType === "up",
                ),
                down: recipe.userVotes.some(
                    (vote) =>
                        vote.user.toString() === userId.toString() && vote.voteType === "down",
                ),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// [GET] /recipes/test-recommendations/:id
module.exports.testRecommendations = async (req, res) => {
    try {
        const recommendations = await recommendationService.getRecommendations(req.params.id);
        res.json({ recommendations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports.showStoredRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({ author: req.user._id })
            .populate("author", "username first_name last_name profile_picture")
            .lean();

        res.render("recipes/recipe-store", {
            layout: "default",
            title: "My Recipes",
            recipes,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};
