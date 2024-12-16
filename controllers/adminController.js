// controllers/adminController.js
const User = require('../models/User');

// Show Admin Dashboard
module.exports.showDashboard = (req, res) => {
    res.render('admin/dashboard', {
        layout: 'default-logined',
        title: 'Admin Dashboard',
    });
};

// List Users
module.exports.listUsers = async (req, res) => {
    try {
        const users = await User.find().lean();
        res.render('admin/users', {
            layout: 'default-logined',
            title: 'Users List',
            users,
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('default/500', {
            layout: 'default-logined',
            title: 'Server Error',
        });
    }
};

// Delete User
module.exports.deleteUser = async (req, res) => {
    try {
        await User.deleteOne({ _id: req.params.id });
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.status(500).render('default/500', {
            layout: 'default-logined',
            title: 'Server Error',
        });
    }
};