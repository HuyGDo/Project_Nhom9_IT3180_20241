const express = require("express");
const router = express.Router();
const meController = require("../controllers/meController");
const auth = require("../middlewares/authMiddleware");

// Route to create new recipe
router.get("/stored/recipes", auth.requireAuth, meController.showStoredRecipes);

// Route to get user's info
router.get("/", auth.requireAuth, meController.showUserInfo);

module.exports = router;
