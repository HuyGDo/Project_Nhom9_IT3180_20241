const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const auth = require("../middleware/authMiddleware");

// Route to get all recipes
router.get("/", recipeController.showRecipes);

// Route to create new recipe
router.get("/create", auth.requireAuth, recipeController.createRecipe);

// Route to store new recipe
router.post("/store", recipeController.storeRecipe);

// Route to update recipe
router.get("/:id/edit", recipeController.editRecipe);
router.put("/:id", recipeController.updateRecipe);

// Route to delete recipe
router.delete("/:id", recipeController.deleteRecipe);

// Route to vote recipe 
router.post('/:id/vote', auth.requireAuthAPI, recipeController.handleVote);
// Route to recipe details 
router.get("/:id", recipeController.showRecipeDetail);

module.exports = router;
