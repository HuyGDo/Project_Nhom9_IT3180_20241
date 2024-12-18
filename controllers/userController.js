//controllers/userController.js
const User = require('../models/User');

exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!currentUser.following.includes(userToFollow._id)) {
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
      await currentUser.save();
      await userToFollow.save();
    }

    res.redirect(`/users/${userToFollow._id}`);
  } catch (error) {
    res.status(500).send('Error following user');
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    currentUser.following = currentUser.following.filter(
      (id) => !id.equals(userToUnfollow._id)
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => !id.equals(currentUser._id)
    );
    await currentUser.save();
    await userToUnfollow.save();

    res.redirect(`/users/${userToUnfollow._id}`);
  } catch (error) {
    res.status(500).send('Error unfollowing user');
  }
};

exports.viewProfile = async (req, res) => {
    try {
    console.log('Requested User ID:', req.params.id);
      const profileUser = await User.findById(req.params.id).lean();
      const currentUser = req.user;
  
      const isOwnProfile = currentUser && profileUser._id.equals(currentUser._id);
      const isFollowing = currentUser && currentUser.following.includes(profileUser._id);
  
      res.render('users/profile', {
        layout: 'default',
        user: profileUser,
        isOwnProfile,
        isFollowing,
      });
    } catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).send('Error loading profile');
    }
  };