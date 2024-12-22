const express = require("express");
const router = express.Router();
const meController = require("../controllers/meController");
const auth = require("../middleware/authMiddleware");

// Existing routes
router.get("/", auth.requireAuth, meController.showUserInfo);
router.get("/stored/recipes", auth.requireAuth, meController.showStoredRecipes);

// New follow/unfollow routes
router.post("/follow/:userId", auth.requireAuth, meController.followUser);
router.post("/unfollow/:userId", auth.requireAuth, meController.unfollowUser);
router.get("/following", auth.requireAuth, meController.getFollowing);
router.get("/followers", auth.requireAuth, meController.getFollowers);

module.exports = router;
