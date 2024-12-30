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
            const notificationId = req.params.id;
            const userId = req.user._id;

            await notificationService.markAsRead(notificationId, userId);
            
            // Get updated unread count
            const unreadCount = await notificationService.getUnreadCount(userId);
            
            res.json({ 
                success: true, 
                message: "Notification marked as read",
                unreadCount 
            });
        } catch (error) {
            console.error("Error in markAsRead:", error);
            res.status(500).json({ 
                success: false, 
                message: error.message || "Error marking notification as read" 
            });
        }
    }

    // Mark all notifications as read
    async markAllAsRead(req, res) {
        try {
            const userId = req.user._id;
            await notificationService.markAllAsRead(userId);
            
            res.json({ 
                success: true, 
                message: "All notifications marked as read",
                unreadCount: 0
            });
        } catch (error) {
            console.error("Error in markAllAsRead:", error);
            res.status(500).json({ 
                success: false, 
                message: error.message || "Error marking all notifications as read" 
            });
        }
    }

    // Get notifications page
    async getNotificationsPage(req, res) {
        try {
            const notifications = await notificationService.getUserNotifications(req.user._id);
            console.log("Notifications:", notifications);
            res.render("notification/index", {
                title: "Notifications",
                notifications,
                user: req.user
            });
        } catch (error) {
            console.error("Error in getNotificationsPage:", error);
            res.status(500).json({ error: "Error fetching notifications page" });
        }
    }
}

module.exports = new NotificationController();
