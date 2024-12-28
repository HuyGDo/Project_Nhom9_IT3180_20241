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
        const user = await User.findById(req.user._id)
            .populate({
                path: "following",
                select: "first_name last_name username profile_picture followers",
            })
            .lean();

        // Get recipes count for each followed user
        const following = await Promise.all(
            user.following.map(async (followedUser) => {
                const recipeCount = await Recipe.countDocuments({ author: followedUser._id });
                return {
                    ...followedUser,
                    isFollowing: true,
                    recipes: { length: recipeCount },
                };
            }),
        );

        res.render("users/me/following", {
            layout: "default",
            title: "Following",
            following,
        });
    } catch (error) {
        console.error("Error fetching following:", error);
        res.status(500).send("Server Error");
    }
};

// [GET] /me/followers
module.exports.getFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: "followers",
                select: "first_name last_name username profile_picture followers",
            })
            .lean();

        // Get recipes count for each follower
        const followers = await Promise.all(
            user.followers.map(async (follower) => {
                const recipeCount = await Recipe.countDocuments({ author: follower._id });
                return {
                    ...follower,
                    isFollowing: req.user.following.includes(follower._id),
                    recipes: { length: recipeCount },
                };
            }),
        );

        res.render("users/me/followers", {
            layout: "default",
            title: "My Followers",
            followers,
        });
    } catch (error) {
        console.error("Error fetching followers:", error);
        res.status(500).send("Server Error");
    }
};

// [GET] /users/:id
module.exports.viewProfile = async (req, res) => {
    try {
        const profileUser = await User.findById(req.params.id)
            .populate({
                path: "recipes",
                select: "title image description votes views createdAt slug",
                options: {
                    sort: { createdAt: -1 },
                    limit: 4,
                },
            })
            .lean();

        if (!profileUser) {
            return res.status(404).render("default/404");
        }

        // Check if the logged-in user is following this profile
        const isFollowing = req.user
            ? req.user.following.some((id) => id.toString() === profileUser._id.toString())
            : false;

        // Check if this is the user's own profile
        const isOwnProfile = req.user
            ? req.user._id.toString() === profileUser._id.toString()
            : false;

        res.render("users/profile", {
            layout: "default",
            title: `${profileUser.first_name}'s Profile`,
            profileUser,
            isOwnProfile,
            isFollowing,
            isAuthenticated: !!req.user,
        });
    } catch (error) {
        console.error("Error viewing profile:", error);
        res.status(500).send("Server Error");
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
