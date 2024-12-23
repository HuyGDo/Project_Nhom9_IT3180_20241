const express = require("express");
const path = require("path");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const fs = require("fs");

// Config multer for storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, "../uploads");
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Add timestamp to filename to make it unique
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

// Add file filter to only accept images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Not an image! Please upload an image."), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// Route to create new recipe
router.get("/create", auth.requireAuth, recipeController.createRecipe);

// Route to store new recipe
router.post(
    "/store",
    auth.requireAuth,
    upload.single("recipe-image"),
    recipeController.storeRecipe,
);

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

// Add these routes
// router.post("/:id/like", auth.requireAuth, recipeController.likeRecipe);
// router.post("/:id/comment", auth.requireAuth, recipeController.addComment);

module.exports = router;
