const notificationService = require("../services/notificationService");
const User = require("../models/User");

module.exports = {
    // Get user's notifications
    async getUserNotifications(req, res) {
        try {
            const notifications = await notificationService.getUserNotifications(req.user._id);
            res.render("notifications/index", {
                layout: "default-logined",
                title: "Notifications",
                notifications,
            });
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.status(500).json({ error: "Failed to fetch notifications" });
        }
    },

    // Mark notification as read
    async markAsRead(req, res) {
        try {
            await notificationService.markAsRead(req.params.id, req.user._id);
            res.status(200).json({ message: "Notification marked as read" });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            res.status(500).json({ error: "Failed to mark notification as read" });
        }
    },

    // Get notification preferences
    async getPreferences(req, res) {
        try {
            const user = await User.findById(req.user._id).select("notification_preferences");
            res.render("notifications/preferences", {
                layout: "default-logined",
                title: "Notification Preferences",
                preferences: user.notification_preferences,
            });
        } catch (error) {
            console.error("Error fetching preferences:", error);
            res.status(500).json({ error: "Failed to fetch preferences" });
        }
    },

    // Update notification preferences
    async updatePreferences(req, res) {
        try {
            const { email_notifications, web_notifications } = req.body;

            await User.findByIdAndUpdate(req.user._id, {
                notification_preferences: {
                    email_notifications: Boolean(email_notifications),
                    web_notifications: Boolean(web_notifications),
                },
            });

            req.flash("success_msg", "Notification preferences updated successfully");
            res.redirect("/notifications/preferences");
        } catch (error) {
            console.error("Error updating preferences:", error);
            req.flash("error_msg", "Failed to update notification preferences");
            res.redirect("/notifications/preferences");
        }
    },

    // Get unread notification count (for navbar badge)
    async getUnreadCount(req, res) {
        try {
            const notifications = await notificationService.getUserNotifications(req.user._id);
            const unreadCount = notifications.filter((n) => !n.is_read).length;
            res.json({ count: unreadCount });
        } catch (error) {
            console.error("Error fetching unread count:", error);
            res.status(500).json({ error: "Failed to fetch unread count" });
        }
    },
};
