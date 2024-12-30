// routes/adminRouters.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");

// Admin Dashboard
router.get("/dashboard", auth.requireAuth, auth.checkUser, adminController.showDashboard);

// List Users
router.get("/users", auth.requireAuth, auth.checkUser, adminController.listUsers);

// Delete User
router.delete("/users/:id", auth.requireAuth, auth.checkUser, adminController.deleteUser);

module.exports = router;
