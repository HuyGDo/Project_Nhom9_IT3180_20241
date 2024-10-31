const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/notifications', notificationController.createNotifications);

router.get('/notifications/unread', notificationController.getUnreadNotifications);

router.put('/notifications/:notificationId/read', notificationController.markAsRead);

module.exports = router;