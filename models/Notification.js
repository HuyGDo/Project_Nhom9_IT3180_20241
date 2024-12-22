const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true },
        notification_type: {
            type: String,
            enum: ["like", "comment", "new_post", "trending", "follow"],
            required: true,
        },
        content_id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "content_type",
            required: true,
        }, // Blog or Recipe
        content_type: { type: String, enum: ["Recipe", "Blog"], required: true },
        is_read: { type: Boolean, default: false },
        is_email: { type: Boolean, default: false },
    },
    {
        collection: "notifications",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    },
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
