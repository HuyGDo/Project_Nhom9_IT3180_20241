// controllers/profileController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Reuse the errorHandler from authController or create a separate utility
const errorHandler = (err) => {
    console.log("Error Handler - Message:", err.message, "Code:", err.code);
    let errors = {
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        username: "",
        profile_picture: "",
    };

    // Incorrect email
    if (err.message === "Incorrect email.") {
        errors.email = "Email is not registered.";
    }

    // Incorrect password
    if (err.message === "Incorrect password.") {
        errors.password = "Password is incorrect.";
    }

    // Duplicate error code
    if (err.code === 11000) {
        errors.email = "This email is already in use.";
        return errors;
    }

    if (err.message.includes("User validation failed")) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
};

const maxAge = 24 * 60 * 60; // 1 day in seconds
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: maxAge,
    });
};

// [GET] /me/edit
module.exports.showEditProfile = (req, res) => {
    const user = res.locals.user;
    console.log("showEditProfile - User:", user);
    res.render("users/me/edit-profile", {
        layout: "default",
        title: "Edit Profile",
        successMessage: "Your profile has been updated successfully!",
        user,
    });
};

// [POST] /me/edit
module.exports.updateProfile = async (req, res) => {
    const userId = res.locals.user ? res.locals.user._id : null;

    try {
        if (!userId) {
            return res.status(401).redirect("/sign-in");
        }

        const updates = { ...req.body };

        // If new file uploaded, update profile picture
        if (req.file) {
            updates.profile_picture = `/uploads/avatars/${req.file.filename}`;
            console.log("file:", req.file);
            console.log("New profile picture path:", updates.profile_picture);
        }

        // Handle password update
        if (updates.password && updates.password.trim() !== "") {
            const user = await User.findById(userId);
            user.password = updates.password;
            await user.save();
            delete updates.password;
        } else {
            delete updates.password;
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true },
        );

        if (!updatedUser) {
            throw new Error("User not found");
        }

        // Reissue JWT token
        const token = createToken(updatedUser._id);
        res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

        req.flash("success", "Profile updated successfully");
        res.redirect("/users/me");
    } catch (error) {
        console.error("Profile update error:", error);
        res.render("users/me/edit-profile", {
            layout: "default",
            title: "Edit Profile",
            user: { ...req.body, _id: userId },
            errors: errorHandler(error),
        });
    }
};

// [GET] /me
module.exports.showUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).lean();
        res.render("users/user-info", {
            layout: "default",
            title: "My Profile",
            user,
            successMessage: req.flash("success")[0], // Get flash message
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};
