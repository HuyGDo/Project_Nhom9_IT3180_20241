// filepath: routes/userRouters.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// View other users profile
router.get('/users/:id', userController.viewProfile);

// Follow a user
router.post('/users/:id/follow', userController.followUser);

// Unfollow a user
router.post('/users/:id/unfollow', userController.unfollowUser);

module.exports = router;