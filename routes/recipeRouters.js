// recipeRouters.js

const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

// Route to get all recipes
router.get('/', recipeController.getAllRecipes);

// Route to get a specific recipe by ID
router.get('/:id', recipeController.getRecipeById);

// Route to create a new recipe
router.post('/', recipeController.createRecipe);

// Route to update an existing recipe by ID
router.put('/:id', recipeController.updateRecipe);

// Route to delete a recipe by ID
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router;
