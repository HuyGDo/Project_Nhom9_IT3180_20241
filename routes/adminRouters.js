// routes/adminRouters.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Admin Dashboard
router.get('/dashboard', auth.requireAuth, auth.checkUser, adminMiddleware.requireAdmin, adminController.showDashboard);

// List Users
router.get('/users', auth.requireAuth, auth.checkUser, adminMiddleware.requireAdmin, adminController.listUsers);

// Delete User
router.delete('/users/:id', auth.requireAuth, auth.checkUser, adminMiddleware.requireAdmin, adminController.deleteUser);

module.exports = router;