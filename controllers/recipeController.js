const Recipe = require("../models/recipeModel");

// Controller function for rendering the recipe browse page
module.exports.show = async (req, res) => {
    try {
        // Get recipe data from the database
        const data = await Recipe.find().lean();

        // Render the recipe-detail page with the recipe data
        res.render("recipe-browse", {
            layout: "main",
            title: "Browse recipes",
            recipes: data,
        });
    } catch (error) {
        console.error("Error fetching recipes:", error);
        res.status(500).send("An error occurred while fetching recipes.");
    }
};
// recipeController.js

const Recipe = require('../models/Recipe');  // Assuming you have a Recipe model defined

// Get all recipes
exports.getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find();  // Fetch all recipes from the database
        res.status(200).json(recipes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch recipes', error });
    }
};

// Get a single recipe by ID
exports.getRecipeById = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        res.status(200).json(recipe);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch the recipe', error });
    }
};

// Create a new recipe
exports.createRecipe = async (req, res) => {
    try {
        const newRecipe = new Recipe(req.body);  // Create a new recipe with the request body data
        const savedRecipe = await newRecipe.save();  // Save the recipe to the database
        res.status(201).json(savedRecipe);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create recipe', error });
    }
};

// Update an existing recipe
exports.updateRecipe = async (req, res) => {
    try {
        const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedRecipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        res.status(200).json(updatedRecipe);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update recipe', error });
    }
};

// Delete a recipe
exports.deleteRecipe = async (req, res) => {
    try {
        const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
        if (!deletedRecipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        res.status(200).json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete recipe', error });
    }
};
