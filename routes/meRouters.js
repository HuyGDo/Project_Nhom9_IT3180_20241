// routes/meRouters.js
const express = require("express");
const router = express.Router();
const meController = require("../controllers/meController");
const profileController = require("../controllers/profileController");
const auth = require("../middleware/authMiddleware");

// Route to create new recipe
router.get("/stored/recipes", auth.requireAuth, meController.showStoredRecipes);

// Route to get user's info
router.get("/", auth.requireAuth, auth.checkUser, meController.showUserInfo);

// Route to show stored recipes
router.get("/stored/recipes", auth.requireAuth, meController.showStoredRecipes);

// [GET] /me/edit-profile - Show edit profile form
router.get("/edit-profile", auth.requireAuth, profileController.showEditProfile);

// [POST] /me/edit-profile - Handle profile update
router.post("/edit-profile", auth.requireAuth, profileController.updateProfile);

router.post("/follow/:userId", auth.requireAuth, meController.followUser);
router.post("/unfollow/:userId", auth.requireAuth, meController.unfollowUser);
router.get("/following", auth.requireAuth, meController.getFollowing);
router.get("/followers", auth.requireAuth, meController.getFollowers);

module.exports = router;
