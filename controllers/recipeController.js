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

// [GET] /recipes/:id
module.exports.showRecipeDetail = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.render("default/404", {
                layout: "default-logined",
                title: "Page not found",
            });
        }
        
        // Thêm user vào recipe để virtual userVoted hoạt động
        recipe._user = req.user;
        
        res.render("recipes/recipe-detail", {
            layout: "default",
            title: recipe.title,
            recipe: recipe.toObject({ virtuals: true }), // Quan trọng: thêm virtuals
        });
    } catch (err) {
        console.error(err);
        res.render("default/404", {
            layout: "default-logined",
            title: "Page not found",
        });
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
// [POST] /recipes/:id/vote
// ... existing code ...
module.exports.handleVote = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const userId = req.user._id;

        // Tìm recipe bằng id 
        const recipe = await Recipe.findById(id);
        if (!recipe) {
            return res.json({ 
                success: false, 
                message: 'Cannot find recipe' 
            });
        }

        // Kiểm tra vote cũ của user
        const userVoteIndex = recipe.userVotes.findIndex(
            vote => vote.user.toString() === userId.toString()
        );

        // Xóa vote cũ nếu có
        if (userVoteIndex !== -1) {
            const oldVote = recipe.userVotes[userVoteIndex];
            if (oldVote.voteType === voteType) {
                // Nếu vote trùng với vote cũ -> hủy vote
                recipe.userVotes.splice(userVoteIndex, 1);
                recipe.votes[`${oldVote.voteType}votes`] -= 1;
            } else {
                // Nếu vote khác vote cũ -> đổi vote
                recipe.votes[`${oldVote.voteType}votes`] -= 1;
                recipe.votes[`${voteType}votes`] += 1;
                recipe.userVotes[userVoteIndex].voteType = voteType;
            }
        } else {
            // Thêm vote mới
            recipe.userVotes.push({ user: userId, voteType });
            recipe.votes[`${voteType}votes`] += 1;
        }

        await recipe.save();

        res.json({
            success: true,
            upvotes: recipe.votes.upvotes,
            downvotes: recipe.votes.downvotes,
            userVoted: {
                up: voteType === 'up',
                down: voteType === 'down'
            }
        });

    } catch (error) {
        console.error('Handle vote error:', error);
        res.json({ 
            success: false, 
            message: 'Error handle vote' 
        });
    }
};