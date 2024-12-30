const Recipe = require("../models/Recipe");
const fs = require("fs");
const path = require("path");
const notificationService = require("../services/notificationService");
// const recommendationService = require('../services/recommendationService');
const { uploadRecipeImage } = require("../services/uploadService");
const RecommendationService = require('../services/recommendationService');
const fuzzball = require('fuzzball');

// [GET] /recipes/
module.exports.showRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate("author", "username first_name last_name profile_picture")
            .lean();

        res.render("recipes/recipe-browse", {
            layout: "default",
            title: "Browse Recipes",
            recipes,
            searchType: 'recipes',
            searchPlaceholder: 'recipes'
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
            .populate('author')
            .populate({
                path: 'comments.user_id',
                select: 'username first_name last_name profile_picture'
            }).lean();

        if (!recipe) {
            console.log('Recipe not found');
            return res.render("default/404");
        }

        console.log('Found recipe:', recipe._id);

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


        // Increment view count
        await Recipe.findByIdAndUpdate(recipe._id, { $inc: { views: 1 } });

        const isFollowing = req.user ? req.user.following.includes(recipe.author._id) : false;

        // Get recommendations
        let recommendedRecipes = [];
        try {
            console.log('Getting recommendations for recipe:', recipe._id);
            const recommendations = await RecommendationService.getRecommendations(recipe._id.toString());
            console.log('Raw recommendations:', recommendations);

            if (recommendations && recommendations.length > 0) {
                // Get recipes from database using recommendation IDs
                const recipeIds = recommendations.map(r => r.id);
                console.log('Looking for recipes with IDs:', recipeIds);

                const recipesFromDb = await Recipe.find({
                    _id: { $in: recipeIds }
                })
                .select("title image description slug author votes views prepTime cookTime servings difficulty")
                .populate("author", "username first_name last_name profile_picture")
                .lean();

                console.log('Found recipes from DB:', recipesFromDb.map(r => r.title));

                // Create a map for quick recipe lookup
                const recipeMap = new Map(
                    recipesFromDb.map(recipe => [recipe._id.toString(), recipe])
                );

                // Map recommendations preserving order and scores
                recommendedRecipes = recommendations
                    .map(rec => {
                        const recipe = recipeMap.get(rec.id);
                        if (recipe) {
                            console.log(`Processing recommendation: ${recipe.title} (score: ${rec.similarity_score})`);
                            return {
                                ...recipe,
                                similarity_score: rec.similarity_score
                            };
                        }
                        console.log(`Recipe not found for id: ${rec.id}`);
                        return null;
                    })
                    .filter(Boolean);

                console.log('Final recommendations:', 
                    recommendedRecipes.map(r => `${r.title} (score: ${r.similarity_score})`));
            }

            if (recommendedRecipes.length === 0) {
                // Get top 4 recipes by views/votes as fallback
                recommendedRecipes = await Recipe.find({ _id: { $ne: recipe._id } })
                    .sort({ views: -1 })
                    .limit(4)
                    .select("title image description slug author votes views prepTime cookTime servings difficulty")
                    .populate("author", "username first_name last_name profile_picture")
                    .lean();

                console.log('Using fallback recommendations based on popularity');
            }
        } catch (error) {
            console.error("Error getting recommendations:", error);
            recommendedRecipes = [];
        }

        res.render("recipes/recipe-detail", {
            layout: "default",
            title: recipe.title,
            recipe,
            isAuthenticated: !!req.user,
            isFollowing,
            user: req.user,
            messages: {
                success: req.flash("success"),
                error: req.flash("error"),
            },
            recommendations: recommendedRecipes
        });
    } catch (error) {
        console.error(error);
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
            difficulty: req.body.difficulty,
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

// [GET] /recipes/:slug/edit
module.exports.editRecipe = (req, res, next) => {
    Recipe.findOne({ slug: req.params.slug })
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

// [PUT] /recipes/:slug
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
            difficulty: req.body.difficulty,
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

        const updatedRecipe = await Recipe.findOneAndUpdate({ slug: req.params.slug }, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedRecipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        res.redirect(`../users/me/stored/recipes`);
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({
            message: "Error updating recipe",
            error: error.message,
        });
    }
};

// [DELETE] /recipes/:slug
module.exports.deleteRecipe = (req, res, next) => {
    Recipe.deleteOne({ slug: req.params.slug })
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

// [POST] /recipes/:slug/vote
module.exports.handleVote = async (req, res) => {
    try {
        const { voteType } = req.body;
        const userId = req.user._id;

        if (!["up", "down"].includes(voteType)) {
            return res.status(400).json({ success: false, message: "Invalid vote type" });
        }

        const recipe = await Recipe.findOne({ slug: req.params.slug });
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        const existingVoteIndex = recipe.userVotes.findIndex(
            (vote) => vote.user.toString() === userId.toString(),
        );

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

// [GET] /recipes/test-recommendations/:slug
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

// Search recipes
module.exports.searchRecipes = async (req, res) => {
    try {
        console.log('Search query:', req.query);
        const query = req.query.q;
        if (!query) {
            console.log('No query provided, redirecting to /recipes');
            return res.redirect('/recipes');
        }

        // 1. Text search
        const textMatches = await Recipe.find({
            $text: { $search: query }
        })
        .populate("author", "username first_name last_name profile_picture")
        .select("title description image prepTime cookTime difficulty cuisine category votes userVotes createdAt slug")
        .limit(10)
        .lean();
        console.log('Text search results:', textMatches.length);

        // 2. Fuzzy regex search
        const regexMatches = await Recipe.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { "ingredients.name": { $regex: query, $options: 'i' } },
                { "instructions.description": { $regex: query, $options: 'i' } }
            ]
        })
        .populate("author", "username first_name last_name profile_picture")
        .select("title description image prepTime cookTime difficulty cuisine category votes userVotes createdAt slug")
        .limit(10)
        .lean();
        console.log('Regex search results:', regexMatches.length);

        // 3. Fuzzy scoring
        const allRecipes = await Recipe.find()
            .populate("author", "username first_name last_name profile_picture")
            .select("title description image prepTime cookTime difficulty cuisine category votes userVotes createdAt slug")
            .limit(50)
            .lean();

        const fuzzyMatches = allRecipes
            .map(recipe => ({
                ...recipe,
                score: Math.max(
                    fuzzball.partial_ratio(query.toLowerCase(), recipe.title.toLowerCase()),
                    fuzzball.partial_ratio(query.toLowerCase(), recipe.description.toLowerCase())
                )
            }))
            .filter(match => match.score > 70)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        // Combine and deduplicate results using _id
        const seenIds = new Set();
        const combinedResults = [...textMatches, ...regexMatches, ...fuzzyMatches].filter(recipe => {
            if (seenIds.has(recipe._id.toString())) {
                return false;
            }
            seenIds.add(recipe._id.toString());
            return true;
        });

        console.log('Total combined results:', combinedResults.length);

        // Render the correct view
        res.render('recipes/recipe-browse', {
            title: `Search Results for "${query}"`,
            recipes: combinedResults,
            query,
            searchType: 'recipes',
            searchPlaceholder: 'recipes',
            isRecipes: true
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send('Server Error');
    }
};
