const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const { uploadRecipeImage } = require("../services/uploadService");
const commentController = require("../controllers/commentController");

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
router.get("/search", recipeController.searchRecipes);
router.get("/:slug", recipeController.showRecipeDetail);
router.post("/:slug/vote", auth.requireAuth, recipeController.handleVote);
router.post("/:slug/comment", auth.requireAuth, commentController.addComment);
router.put("/:slug/comment/edit", auth.requireAuth, commentController.updateComment);
router.delete("/:slug/comment/delete", auth.requireAuth, commentController.deleteComment);
router.get("/:slug/edit", auth.requireAuth, recipeController.editRecipe);
router.put(
    "/:slug",
    auth.requireAuth,
    upload.single("recipe-image"),
    recipeController.updateRecipe,
);
router.delete("/:slug", auth.requireAuth, recipeController.deleteRecipe);

module.exports = router;
