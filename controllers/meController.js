//controllers/meController.js
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

// [GET] /me
module.exports.showUserInfo = async (req, res) => {
    try {
        // Load user with followers
        const user = await User.findById(res.locals.user._id).populate("followers").lean();
        const followerCount = user.followers.length;

        // Load recipes authored by this user
        const myRecipes = await Recipe.find({ author: user._id }).lean();

        res.render("me/user-info", {
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

// [GET] /me/stored/recipes
module.exports.showStoredRecipes = (req, res, next) => {
    Recipe.find()
        .lean()
        .then((recipes) => {
            res.render("me/stored-recipes", {
                layout: "default",
                title: "My Recipes",
                recipes,
            });
        })
        .catch(next);
};

// [POST] /me/follow/:userId
module.exports.followUser = async (req, res) => {
    try {
        const userToFollowId = req.params.userId;
        const currentUser = await User.findById(req.user._id);

        if (currentUser._id.equals(userToFollowId)) {
            return res.status(400).json({ error: "You cannot follow yourself" });
        }

        if (!currentUser.following.includes(userToFollowId)) {
            currentUser.following.push(userToFollowId);

            const userToFollow = await User.findById(userToFollowId);
            if (userToFollow && !userToFollow.followers.includes(currentUser._id)) {
                userToFollow.followers.push(currentUser._id);
                await userToFollow.save();

                // Create follow notification
                await notificationService.createNotification({
                    type: "follow",
                    payload: {
                        followedUserId: userToFollowId,
                        follower: currentUser,
                    },
                });
            }

            await currentUser.save();
            return res.status(200).json({ message: "Successfully followed user" });
        }

        return res.status(400).json({ message: "Already following this user" });
    } catch (error) {
        console.error("Error following user:", error);
        res.status(500).json({ error: "Failed to follow user" });
    }
};

// [POST] /me/unfollow/:userId
module.exports.unfollowUser = async (req, res) => {
    try {
        const userToUnfollowId = req.params.userId;
        const currentUser = await User.findById(req.user._id);

        currentUser.following = currentUser.following.filter((id) => !id.equals(userToUnfollowId));

        const userToUnfollow = await User.findById(userToUnfollowId);
        if (userToUnfollow) {
            userToUnfollow.followers = userToUnfollow.followers.filter(
                (id) => !id.equals(currentUser._id),
            );
            await userToUnfollow.save();
        }

        await currentUser.save();
        res.status(200).json({ message: "Successfully unfollowed user" });
    } catch (error) {
        console.error("Error unfollowing user:", error);
        res.status(500).json({ error: "Failed to unfollow user" });
    }
};

// [GET] /me/following
module.exports.getFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("following");
        res.render("me/following", {
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
        res.render("me/followers", {
            layout: "default",
            title: "Followers",
            followers: user.followers,
        });
    } catch (error) {
        console.error("Error getting followers list:", error);
        res.status(500).json({ error: "Failed to get followers list" });
    }
};
