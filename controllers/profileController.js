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
        errors.password = "Password incorrect.";
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
    res.render("me/edit-profile", {
        layout: "default-logined",
        title: "Edit Profile",
        successMessage: "Your profile has been updated successfully!",
        user,
    });
};

// [POST] /me/edit
module.exports.updateProfile = async (req, res) => {
    const userId = res.locals.user ? res.locals.user._id : null;
    const formData = req.body;
    console.log("updateProfile - User ID:", userId);
    console.log("updateProfile - Form Data:", formData);

    if (!userId) {
        console.log("updateProfile - No User ID Found");
        return res.status(401).redirect("/sign-in");
    }

    try {
        const user = await User.findById(userId).lean();

        if (!user) {
            console.log("updateProfile - User Not Found");
            return res.status(404).render("default/404", {
                layout: "default-logined",
                title: "User not found",
            });
        }

        // Update fields
        user.first_name = formData.first_name || user.first_name;
        user.last_name = formData.last_name || user.last_name;
        user.email = formData.email || user.email;
        user.username = formData.username || user.username;

        // If password is provided, update it
        if (formData.password) {
            user.password = formData.password;
        }

        // If profile_picture is provided, update it
        if (formData.profile_picture) {
            user.profile_picture = formData.profile_picture;
        }

        await user.save();
        console.log("updateProfile - User Saved Successfully");

        // Reissue JWT token
        const token = createToken(user._id);
        res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
        console.log("updateProfile - JWT Token Issued:", token);

        res.redirect("/me");
    } catch (err) {
        console.log("updateProfile - Error:", err);
        const errors = errorHandler(err);
        res.render("me/edit-profile", {
            layout: "default-logined",
            title: "Edit Profile",
            errors,
            user: formData,
        });
    }
};
