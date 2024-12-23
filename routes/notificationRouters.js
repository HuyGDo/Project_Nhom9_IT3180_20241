const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth.requireAuth, notificationController.getUserNotifications);
router.put("/:id/read", auth.requireAuth, notificationController.markAsRead);
router.get("/preferences", auth.requireAuth, notificationController.getPreferences);
router.put("/preferences", auth.requireAuth, notificationController.updatePreferences);
router.get("/unread-count", auth.requireAuth, notificationController.getUnreadCount);

module.exports = router;
