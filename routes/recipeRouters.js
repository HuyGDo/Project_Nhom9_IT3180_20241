const express = require("express");
const path = require("path");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");

// Config multer for storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage });

// Route to create new recipe
router.get("/create", auth.requireAuth, recipeController.createRecipe);

// Route to store new recipe
router.post("/store", auth.requireAuth, upload.single("recipe-image"), recipeController.storeRecipe);

// Route to update recipe
router.get("/:id/edit", recipeController.editRecipe);
router.put("/:id", recipeController.updateRecipe);

// Route to delete recipe
router.delete("/:id", recipeController.deleteRecipe);

// Route to vote for a recipe
router.post('/:id/vote', auth.requireAuthAPI, recipeController.handleVote);
// Route to recipe details
router.get("/:slug", recipeController.showRecipeDetail);

// Route to get all recipes
router.get("/", recipeController.showRecipes);

module.exports = router;
