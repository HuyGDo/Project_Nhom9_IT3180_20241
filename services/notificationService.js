const Notification = require("../models/Notification");

class NotificationService {
    // Get all notifications for a user
    async getUserNotifications(userId) {
        try {
            console.log("Fetching notifications for user:", userId);
            const notifications = await Notification.find({ recipient_id: userId })
                .sort({ created_at: -1 })
                .limit(10)
                .populate({
                    path: "content_id",
                    refPath: "content_type",
                    select: "title slug _id author",
                })
                .lean();

            console.log("Raw notifications:", JSON.stringify(notifications, null, 2));

            // Only filter out null content_id notifications (deleted content)
            // but keep read notifications
            const validNotifications = notifications.filter(
                (notification) => notification.content_id !== null,
            );

            // Populate author information for each notification
            const populatedNotifications = await Promise.all(
                validNotifications.map(async (notification) => {
                    if (notification.content_id && notification.content_id.author) {
                        const User = require("../models/User");
                        const author = await User.findById(notification.content_id.author)
                            .select("username profile_picture")
                            .lean();
                        
                        if (author) {
                            notification.content_id.author = author;
                        }
                    }
                    return notification;
                })
            );

            // Debug log to see what's being returned
            populatedNotifications.forEach((notification) => {
                console.log("Notification content:", {
                    type: notification.notification_type,
                    contentType: notification.content_type,
                    contentId: notification.content_id,
                    userId: notification.content_id?.author?._id,
                    username: notification.content_id?.author?.username,
                    profilePicture: notification.content_id?.author?.profile_picture,
                    title: notification.content_id?.title,
                    slug: notification.content_id?.slug,
                    isRead: notification.is_read,
                });
            });

            return populatedNotifications;
        } catch (error) {
            console.error("Error in getUserNotifications:", error);
            throw new Error("Error fetching notifications");
        }
    }

    // Get unread notification count
    async getUnreadCount(userId) {
        try {
            const count = await Notification.countDocuments({
                recipient_id: userId,
                is_read: false,
            });
            return count;
        } catch (error) {
            throw new Error("Error counting unread notifications");
        }
    }

    // Mark a notification as read
    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                {
                    _id: notificationId,
                    recipient_id: userId,
                },
                { is_read: true },
                { new: true },
            );
            return notification;
        } catch (error) {
            throw new Error("Error marking notification as read");
        }
    }

    // Mark all notifications as read
    async markAllAsRead(userId) {
        try {
            await Notification.updateMany(
                {
                    recipient_id: userId,
                    is_read: false,
                },
                { is_read: true },
            );
            return true;
        } catch (error) {
            throw new Error("Error marking all notifications as read");
        }
    }

    // Create a new notification
    async createNotification(data) {
        try {
            const notification = new Notification({
                recipient_id: data.userId,
                message: data.message,
                notification_type: data.type,
                content_type: data.contentType,
                content_id: data.contentId,
                is_read: false,
                is_email: false,
            });
            await notification.save();
            return notification;
        } catch (error) {
            throw new Error("Error creating notification");
        }
    }

    // Create follow notification
    async createFollowNotification(follower, followedUser) {
        try {
            const notification = await this.createNotification({
                userId: followedUser._id, // recipient_id
                type: "follow",
                message: `${follower.username} started following you`,
                contentType: "User",
                contentId: follower._id,
            });
            return notification;
        } catch (error) {
            console.error("Error creating follow notification:", error);
            throw error;
        }
    }

    // Create new content notification for followers
    async createNewContentNotification(author, contentId, contentType, contentTitle) {
        try {
            console.log("Creating new content notification:", {
                author: author._id,
                contentId,
                contentType,
                contentTitle,
            });

            const User = require("../models/User");
            const followers = await User.find({ following: author._id }).select("_id");
            console.log("Found followers:", followers);

            // Get the content document to ensure we have the slug
            let content;
            if (contentType === "Blog") {
                const Blog = require("../models/Blog");
                content = await Blog.findById(contentId);
            } else if (contentType === "Recipe") {
                const Recipe = require("../models/Recipe");
                content = await Recipe.findById(contentId);
            }

            console.log("Found content:", content);

            if (!content) {
                throw new Error("Content not found");
            }

            const notifications = followers.map((follower) => ({
                userId: follower._id,
                type: "new_post",
                message: `${
                    author.username
                } posted a new ${contentType.toLowerCase()}: ${contentTitle}`,
                contentType: contentType,
                contentId: content._id,
            }));

            console.log("Creating notifications:", notifications);

            const createdNotifications = await Promise.all(
                notifications.map((notification) => this.createNotification(notification)),
            );

            console.log("Created notifications:", createdNotifications);
            return createdNotifications;
        } catch (error) {
            console.error("Error creating new content notifications:", error);
            throw error;
        }
    }

    // Create like notification
    async createLikeNotification(liker, content, contentType) {
        try {
            const notification = await this.createNotification({
                userId: content.author,
                type: "like",
                message: `${liker.username} liked your ${contentType.toLowerCase()}`,
                contentType: contentType,
                contentId: content._id,
            });
            return notification;
        } catch (error) {
            console.error("Error creating like notification:", error);
            throw error;
        }
    }

    // Create comment notification
    async createCommentNotification(commenter, content, contentType) {
        try {
            const notification = await this.createNotification({
                userId: content.author,
                type: "comment",
                message: `${commenter.username} commented on your ${contentType.toLowerCase()}`,
                contentType: contentType,
                contentId: content._id,
            });
            return notification;
        } catch (error) {
            console.error("Error creating comment notification:", error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
