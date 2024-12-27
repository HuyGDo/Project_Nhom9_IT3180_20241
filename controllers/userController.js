//controllers/userController.js
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const mongoose = require("mongoose");
const notificationService = require("../services/notificationService");

// [GET] /me
module.exports.showUserInfo = async (req, res) => {
    try {
        // Load user with followers
        const user = await User.findById(res.locals.user._id).populate("followers").lean();
        const followerCount = user.followers.length;

        // Load recipes authored by this user
        const myRecipes = await Recipe.find({ author: user._id }).lean();

        res.render("users/me/user-info", {
            layout: "default",
            title: "My Profile",
            user,
            followerCount,
            myRecipes,
        });
    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).send("Error fetching user info");
    }
};

// [GET] /me/following
module.exports.getFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("following");
        res.render("users/me/following", {
            layout: "default",
            title: "Following",
            following: user.following,
        });
    } catch (error) {
        console.error("Error getting following list:", error);
        res.status(500).json({ error: "Failed to get following list" });
    }
};

// [GET] /me/followers
module.exports.getFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("followers");
        res.render("users/me/followers", {
            layout: "default",
            title: "Followers",
            followers: user.followers,
        });
    } catch (error) {
        console.error("Error getting followers list:", error);
        res.status(500).json({ error: "Failed to get followers list" });
    }
};

// [GET] /users/:id
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

        const recipes = await Recipe.find({ author: userId })
            .sort({ createdAt: -1 })
            .limit(4)
            .lean();

        const currentUserId = req.user?._id || res.locals.user?._id;
        console.log("Current User:", currentUserId);

        let isSubscribed = false;
        if (currentUserId?.following && profileUser) {
            isSubscribed = currentUserId.following.some(
                (followId) => followId.toString() === profileUser._id.toString(),
            );
        }
        console.log("Is Subscribed:", isSubscribed);

        // Check if this is the current user's profile
        const isOwnProfile = currentUserId && currentUserId.toString() === userId.toString();

        res.render("users/profile", {
            layout: "default",
            title: "View Profile",
            profileUser,
            isSubscribed,
            recipes,
            isOwnProfile,
        });
    } catch (error) {
        console.error("Error loading profile:", error);
        res.status(500).send(`Error loading profile: ${error.message}`);
    }
};

// [POST] /users/:id/follow
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

        // Create follow notification
        await notificationService.createNotification({
            type: "follow",
            payload: {
                followedUserId: targetUserId,
                follower: currentUser,
            },
        });

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

// [POST] /users/:id/unfollow
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

// [GET] /users
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
