//controllers/userController.js
const User = require("../models/User");
const mongoose = require("mongoose");

module.exports.viewProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log("Requested User ID:", userId);

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send("Invalid user ID");
        }

        const profileUser = await User.findOne({ _id: userId }).lean();

        if (!profileUser) {
            return res.status(404).send("User not found");
        }

        const currentUser = await User.findById(req.user?._id || res.locals.user?._id).lean();
        console.log("Current User:", currentUser);

        let isSubscribed = false;
        if (currentUser?.following && profileUser) {
            isSubscribed = currentUser.following.some(
                (followId) => followId.toString() === profileUser._id.toString(),
            );
        }
        console.log("Is Subscribed:", isSubscribed);

        res.render("users/profile", {
            layout: "default",
            title: "View Profile",
            profileUser,
            isSubscribed,
        });
    } catch (error) {
        console.error("Error loading profile:", error);
        res.status(500).send(`Error loading profile: ${error.message}`);
    }
};

module.exports.followUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;

        if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const currentUserId = req.user?._id || res.locals.user?._id;
        if (!currentUserId) {
            return res.status(401).json({ message: "Please login to continue" });
        }

        if (currentUserId.toString() === targetUserId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "Target user not found" });
        }

        await currentUser.follow(targetUserId);

        res.redirect(`/users/${targetUserId}`);
    } catch (error) {
        console.error("Follow error:", error);
        res.status(500).send("Unable to follow this user");
    }
};

module.exports.unfollowUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;

        if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const currentUserId = req.user?._id || res.locals.user?._id;
        if (!currentUserId) {
            return res.status(401).json({ message: "Please login to continue" });
        }

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "Target user not found" });
        }

        await currentUser.unfollow(targetUserId);

        res.redirect(`/users/${targetUserId}`);
    } catch (error) {
        console.error("Unfollow error:", error);
        res.status(500).send("Unable to unfollow this user");
    }
};
