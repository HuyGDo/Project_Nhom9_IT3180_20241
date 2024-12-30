// controllers/adminController.js
const User = require("../models/User");

// Show Admin Dashboard
module.exports.showDashboard = (req, res) => {
    res.render("admin/dashboard", {
        layout: "default",
        title: "Admin Dashboard",
    });
};

// List Users
module.exports.listUsers = async (req, res) => {
    try {
        const users = await User.find().lean();
        res.render("admin/admin-users", {
            layout: "default",
            title: "Users List",
            users,
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("default/500", {
            layout: "default",
            title: "Server Error",
        });
    }
};

// Delete User
module.exports.deleteUser = async (req, res) => {
    try {
        await User.deleteOne({ _id: req.params.id });
        res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).render("admin/500", {
            layout: "default",
            title: "Server Error",
        });
    }
};
