// routes/adminRouters.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");

// Admin Dashboard
router.get("/dashboard", auth.requireAdmin, adminController.showDashboard);

// User Management
router.get("/users", auth.requireAdmin, adminController.listUsers);
router.delete("/users/:id", auth.requireAdmin, adminController.deleteUser);

module.exports = router;
