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
        const userId = req.params.id;

        // Don't allow admin to delete themselves
        if (userId === req.user._id.toString()) {
            req.flash("error", "You cannot delete your own account");
            return res.redirect("/admin/users");
        }

        await User.findByIdAndDelete(userId);
        req.flash("success", "User deleted successfully");
        res.redirect("/admin/users");
    } catch (error) {
        console.error("Error deleting user:", error);
        req.flash("error", "Error deleting user");
        res.redirect("/admin/users");
    }
};
