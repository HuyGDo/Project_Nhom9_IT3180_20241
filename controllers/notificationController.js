const notificationService = require("../services/notificationService");

class NotificationController {
    // Get notifications for dropdown
    async getNotifications(req, res) {
        try {
            const notifications = await notificationService.getUserNotifications(req.user._id);
            console.log("Fetched notifications for user:", req.user._id);
            console.log("Notifications:", notifications);
            res.json({ notifications });
        } catch (error) {
            console.error("Error in getNotifications:", error);
            res.status(500).json({ error: "Error fetching notifications" });
        }
    }

    // Get unread notification count
    async getUnreadCount(req, res) {
        try {
            const count = await notificationService.getUnreadCount(req.user._id);
            console.log("Unread count for user:", req.user._id, "Count:", count);
            res.json({ count });
        } catch (error) {
            console.error("Error in getUnreadCount:", error);
            res.status(500).json({ error: "Error counting notifications" });
        }
    }

    // Mark notification as read
    async markAsRead(req, res) {
        try {
            const notification = await notificationService.markAsRead(req.params.id, req.user._id);
            res.json({ success: true, notification });
        } catch (error) {
            res.status(500).json({ error: "Error marking notification as read" });
        }
    }

    // Mark all notifications as read
    async markAllAsRead(req, res) {
        try {
            await notificationService.markAllAsRead(req.user._id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Error marking notifications as read" });
        }
    }
}

module.exports = new NotificationController();
