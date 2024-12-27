const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const auth = require("../middleware/authMiddleware");
const { uploadRecipeImage } = require("../services/uploadService");

// Route to create new recipe
router.get("/create", auth.requireAuth, recipeController.createRecipe);

// Route to store new recipe
router.post("/store", auth.requireAuth, uploadRecipeImage, recipeController.storeRecipe);

// Route to update recipe
router.get("/:id/edit", recipeController.editRecipe);
router.put("/:id", recipeController.updateRecipe);

// Route to delete recipe
router.delete("/:id", recipeController.deleteRecipe);

// Route to vote for a recipe
router.post("/:id/vote", auth.requireAuth, recipeController.handleVote);

// Route to recipe details
router.get("/:slug", recipeController.showRecipeDetail);

// Route to get all recipes
router.get("/", recipeController.showRecipes);

module.exports = router;
