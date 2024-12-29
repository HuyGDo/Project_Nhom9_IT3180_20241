const Notification = require("../models/Notification");
const User = require("../models/User");

module.exports = {
    async createNotification(data) {
        try {
            if (data.type === "follow") {
                const notification = {
                    recipient_id: data.payload.followedUserId,
                    message: `${data.payload.follower.username} started following you`,
                    notification_type: "follow",
                    content_id: data.payload.follower._id,
                    content_type: "User",
                };
                return await Notification.create(notification);
            }

            // Handle content notifications (new posts, likes, comments)
            const notification = await this.createContentNotification(data);
            return notification;
        } catch (error) {
            console.error("Error creating notification:", error);
            throw error;
        }
    },

    async createContentNotification(data) {
        const { type, recipient, sender, message } = data;
        const contentId = data.blog || data.recipe; // Support both blog and recipe notifications
        const contentType = data.blog ? "blog" : "recipe";

        const notification = new Notification({
            type,
            recipient,
            sender,
            [contentType]: contentId, // Dynamically set blog or recipe field
            message,
            read: false,
        });

        return notification.save();
    },

    async createFollowerNotifications(author, contentId, contentType) {
        try {
            // Find all users who follow the author
            const followers = await User.find({
                _id: { $in: author.followers },
                "notification_preferences.web_notifications": true,
            });

            const notifications = followers.map((follower) => ({
                recipient_id: follower._id,
                message: `${author.username} posted a new ${contentType}`,
                notification_type: "new_post",
                content_id: contentId,
                content_type: contentType,
            }));

            if (notifications.length > 0) {
                return await Notification.insertMany(notifications);
            }
            return [];
        } catch (error) {
            console.error("Error creating follower notifications:", error);
            throw error;
        }
    },

    async getUserNotifications(userId) {
        try {
            return await Notification.find({ recipient_id: userId })
                .sort({ created_at: -1 })
                .limit(50)
                .lean();
        } catch (error) {
            console.error("Error getting notifications:", error);
            throw error;
        }
    },

    async markAsRead(notificationId) {
        try {
            return await Notification.findByIdAndUpdate(notificationId, { is_read: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            throw error;
        }
    },

    async getUnreadCount(userId) {
        try {
            return await Notification.countDocuments({
                recipient_id: userId,
                is_read: false,
            });
        } catch (error) {
            console.error("Error getting unread count:", error);
            throw error;
        }
    },
};
