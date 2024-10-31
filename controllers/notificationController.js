const notificationService = require('../services/notificationService');

module.exports.createNotification = async (req, res) => {
    try {
        const { recipient_id, message, notification_type, content_id, content_type } = req.body;
        const notification = await notificationService.createNotification({
            recipient_id,
            message,
            notification_type,
            content_id,
            content_type
        });

        res.status(201).json({ message: 'Notification created successfully', notification });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create notification', error });
    }
};

module.exports.getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have authentication middleware to get user ID
        const notifications = await notificationService.getUnreadNotifications(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve notifications', error });
    }
};

module.exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const updatedNotification = await notificationService.markAsRead(notificationId);
        res.status(200).json({ message: 'Notification marked as read', notification: updatedNotification });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark notification as read', error });
    }
};
