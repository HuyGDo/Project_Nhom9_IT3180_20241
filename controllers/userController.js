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

        const currentUserId = req.user?._id;
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

        return res.json({
            success: true,
            isFollowing: true,
            message: "Successfully followed user",
        });
    } catch (error) {
        console.error("Follow error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to follow this user",
        });
    }
};

module.exports.unfollowUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;

        if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const currentUserId = req.user?._id;
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

        return res.json({
            success: true,
            isFollowing: false,
            message: "Successfully unfollowed user",
        });
    } catch (error) {
        console.error("Unfollow error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to unfollow this user",
        });
    }
};

module.exports.listUsers = async (req, res) => {
    try {
        // Get current user ID
        const currentUserId = req.user?._id;

        // Find all users except current user
        const users = await User.find({
            _id: { $ne: currentUserId },
        }).lean();

        // Get current user's following list
        const currentUser = await User.findById(currentUserId).lean();
        const followingList = currentUser?.following || [];

        // Add isFollowing flag to each user
        const usersWithFollowStatus = users.map((user) => ({
            ...user,
            isFollowing: followingList.some((id) => id.toString() === user._id.toString()),
        }));

        res.render("users/list", {
            layout: "default",
            title: "All Users",
            users: usersWithFollowStatus,
            isAuthenticated: res.locals.isAuthenticated,
        });
    } catch (error) {
        console.error("Error loading users:", error);
        res.status(500).send("Error loading users list");
    }
};
