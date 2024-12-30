const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        notification_type: {
            type: String,
            enum: ["like", "comment", "new_post", "follow"],
            required: true,
        },
        content_type: {
            type: String,
            enum: ["Recipe", "Blog", "User"],
            required: true,
        },
        content_id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "content_type",
            required: true,
        },
        is_read: {
            type: Boolean,
            default: false,
        },
        is_email: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    },
);

module.exports = mongoose.model("Notification", notificationSchema);
