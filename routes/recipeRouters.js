const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const { uploadRecipeImage } = require("../services/uploadService");

// Setup multer for recipe image uploads
const upload = multer({ dest: "uploads/recipes/" });

router.get("/create", auth.requireAuth, recipeController.createRecipe);
router.post(
    "/store",
    auth.requireAuth,
    upload.single("recipe-image"),
    recipeController.storeRecipe,
);

// Route to update recipe
router.get("/", recipeController.showRecipes);
router.get("/:slug", recipeController.showRecipeDetail);
router.post("/:slug/vote", auth.requireAuth, recipeController.handleVote);
router.post("/:slug/comment", auth.requireAuth, recipeController.addComment);
router.get("/:slug/edit", auth.requireAuth, recipeController.editRecipe);
router.put(
    "/:slug",
    auth.requireAuth,
    upload.single("recipe-image"),
    recipeController.updateRecipe,
);
router.delete("/:slug", auth.requireAuth, recipeController.deleteRecipe);

module.exports = router;
