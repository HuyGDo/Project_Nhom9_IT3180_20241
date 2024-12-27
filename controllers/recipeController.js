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
        const recipe = await Recipe.findOne({ slug: req.params.slug })
            .populate("author", "username first_name last_name profile_picture")
            .lean();

        console.log("Recipe detail with author:", JSON.stringify(recipe, null, 2));

        let recommendedRecipes = [];

        try {
            // Thử lấy recommendations
            const recommendations = await recommendationService.getRecommendations(recipe._id);
            if (recommendations && recommendations.length > 0) {
                recommendedRecipes = await Recipe.find({
                    _id: { $in: recommendations },
                })
                    .select("title image votes slug")
                    .lean();
            } else {
                // Fallback: Lấy ngẫu nhiên 5 công thức khác
                recommendedRecipes = await Recipe.find({
                    _id: { $ne: recipe._id },
                })
                    .select("title image votes slug")
                    .limit(5)
                    .lean();
            }
        } catch (error) {
            console.log("Error getting recommendations:", error.message);
            // Fallback: Lấy ngẫu nhiên 5 công thức khác
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

// [GET] /recipes/create
module.exports.createRecipe = (req, res) => {
    res.render("recipes/create", {
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

        // Populate author data after saving
        await recipe.populate("author", "username first_name last_name profile_picture");

        console.log("Recipe with populated author:", recipe);

        res.redirect("/recipes/" + recipe.slug);
    } catch (error) {
        console.error("Error saving recipe:", error);
        res.status(500).render("recipes/create", {
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
            res.render("recipes/edit", {
                layout: "default",
                title: "Edit Recipe",
                recipe,
            });
        })
        .catch(next);
};

// [PUT] /recipes/:id
module.exports.updateRecipe = (req, res, next) => {
    Recipe.updateOne({ _id: req.params.id }, req.body)
        .then(() => res.redirect("users/me/stored/recipes"))
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
// [POST] /recipes/:id/vote
module.exports.handleVote = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const userId = req.user._id;

        // Validate vote type
        if (!["up", "down"].includes(voteType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vote type",
            });
        }

        const recipe = await Recipe.findById(id);
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        // Find existing vote
        const existingVoteIndex = recipe.userVotes.findIndex(
            (vote) => vote.user.toString() === userId.toString(),
        );

        // Handle vote logic
        if (existingVoteIndex > -1) {
            const existingVote = recipe.userVotes[existingVoteIndex];
            if (existingVote.voteType === voteType) {
                // Remove vote if clicking same button
                recipe.userVotes.splice(existingVoteIndex, 1);
                recipe.votes[`${voteType}votes`]--;
            } else {
                // Change vote type
                recipe.votes[`${existingVote.voteType}votes`]--;
                recipe.votes[`${voteType}votes`]++;
                existingVote.voteType = voteType;
            }
        } else {
            // Add new vote
            recipe.userVotes.push({ user: userId, voteType });
            recipe.votes[`${voteType}votes`]++;
        }

        // Update score
        recipe.votes.score = recipe.votes.upvotes - recipe.votes.downvotes;

        await recipe.save();

        // Create notification for recipe author if it's an upvote from another user
        if (voteType === "up" && userId.toString() !== recipe.author.toString()) {
            await notificationService.createNotification({
                type: "vote",
                recipient: recipe.author,
                sender: userId,
                recipe: recipe._id,
                message: "voted for your recipe",
            });
        }

        res.json({
            success: true,
            message: "Vote recorded successfully",
            votes: recipe.votes,
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
        console.error("Vote handling error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Error processing vote",
        });
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

// [POST] /recipes/store
module.exports.store = async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            uploadRecipeImage(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const recipeData = { ...req.body };

        // If image was uploaded
        if (req.file) {
            recipeData.image = `/uploads/recipes/${req.file.filename}`;
        }

        // Add author
        recipeData.author = req.user._id;

        // Create recipe
        const recipe = new Recipe(recipeData);
        await recipe.save();

        // Populate author data before redirecting
        await recipe.populate("author", "username first_name last_name profile_picture");
        console.log("New recipe with author data:", JSON.stringify(recipe, null, 2));

        res.redirect(`/recipes/${recipe.slug}`);
    } catch (error) {
        console.error("Recipe creation error:", error);
        res.render("recipes/create", {
            layout: "default",
            title: "Create Recipe",
            errors: error.errors,
            values: req.body,
        });
    }
};

module.exports.showStoredRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({ author: req.user._id })
            .populate("author", "username first_name last_name profile_picture")
            .lean();

        res.render("me/stored-recipes", {
            layout: "default",
            title: "My Recipes",
            recipes,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};
