const Recipe = require("../models/Recipe");
const fs = require("fs");
const path = require("path");
const notificationService = require("../services/notificationService");
// const recommendationService = require('../services/recommendationService');

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
module.exports.showRecipeDetail = async (req, res) => {
    try {
        const recipe = await Recipe.findOne({ slug: req.params.slug }).lean();
        
        let recommendedRecipes = [];
        
        try {
            // Thử lấy recommendations
            const recommendations = await recommendationService.getRecommendations(recipe._id);
            if (recommendations && recommendations.length > 0) {
                recommendedRecipes = await Recipe.find({
                    '_id': { $in: recommendations }
                })
                .select('title image votes slug')
                .lean();
            } else {
                // Fallback: Lấy ngẫu nhiên 5 công thức khác
                recommendedRecipes = await Recipe.find({
                    '_id': { $ne: recipe._id }
                })
                .select('title image votes slug')
                .limit(5)
                .lean();
            }
        } catch (error) {
            console.log('Error getting recommendations:', error.message);
            // Fallback: Lấy ngẫu nhiên 5 công thức khác
            recommendedRecipes = await Recipe.find({
                '_id': { $ne: recipe._id }
            })
            .select('title image votes slug')
            .limit(5)
            .lean();
        }

        res.render("recipes/recipe-detail", {
            layout: "default",
            title: recipe.title,
            recipe,
            recommendations: recommendedRecipes
        });
    } catch (err) {
        console.error('Error in showRecipeDetail:', err);
        res.render("default/404");
    }
};

// [GET] /recipes/create
module.exports.createRecipe = (req, res) => {
    res.render("recipes/create", {
        layout: "default-logined",
        title: "Create Recipe",
    });
};

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

        // Create new Recipe object
        const recipe = new Recipe({
            title,
            description,
            author: res.locals.user._id, // Important: store the user as the author
            ingredients,
            instructions,
            author: req.user._id,
            image: req.file ? `/uploads/${req.file.filename}` : null,
        });

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
// [POST] /recipes/:id/vote
module.exports.handleVote = (req, res) => {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    Recipe.findById(id)
        .lean()
        .then(recipe => {
            if (!recipe) {
                throw { status: 404, message: 'Recipe not found' };
            }

            if (recipe.author?.toString() === userId.toString()) {
                throw { status: 400, message: 'Cannot vote on your own recipe' };
            }

            // Find existing vote
            const existingVote = recipe.userVotes.find(
                vote => vote.user.toString() === userId.toString()
            );

            let updateOperation;
            if (existingVote) {
                if (existingVote.voteType === voteType) {
                    // Case 1: Click same button - Remove vote
                    updateOperation = {
                        $pull: { userVotes: { user: userId } },
                        $inc: { [`votes.${voteType}votes`]: -1 }
                    };
                } else {
                    // Case 2: Switch vote
                    return Recipe.findOneAndUpdate(
                        { _id: id },
                        { $pull: { userVotes: { user: userId } } },
                        { new: true }
                    ).then(updatedRecipe => {
                        return Recipe.findOneAndUpdate(
                            { _id: id },
                            {
                                $push: { userVotes: { user: userId, voteType } },
                                $inc: {
                                    [`votes.${existingVote.voteType}votes`]: -1,
                                    [`votes.${voteType}votes`]: 1
                                }
                            },
                            { new: true }
                        ).lean();
                    });
                }
            } else {
                // Case 3: New vote
                updateOperation = {
                    $push: { userVotes: { user: userId, voteType } },
                    $inc: { [`votes.${voteType}votes`]: 1 }
                };
            }

            // Update recipe
            return Recipe.findOneAndUpdate(
                { _id: id },
                {
                    ...updateOperation,
                    $set: { 'votes.score': recipe.votes.upvotes - recipe.votes.downvotes }
                },
                { new: true }
            ).lean();
        })
        .then(updatedRecipe => {
            res.json({
                success: true,
                upvotes: updatedRecipe.votes.upvotes,
                downvotes: updatedRecipe.votes.downvotes,
                score: updatedRecipe.votes.score,
                userVoted: {
                    up: voteType === 'up',
                    down: voteType === 'down'
                }
            });
        })
        .catch(error => {
            console.error('Vote handling error:', error);
            res.status(error.status || 500).json({ 
                success: false, 
                message: error.message || 'Error processing vote' 
            });
        });
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