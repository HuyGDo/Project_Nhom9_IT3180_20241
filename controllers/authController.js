const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Error handler
const errorHandler = (err) => {
    console.log(err.message, err.code);
    let errors = {
        email: "",
        password: "",
        first_name: "",
        last_name: "",
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
        errors.email = "This email is already in used.";
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

// [GET] /sign-in/
module.exports.showSignIn = (req, res) => {
    res.render("auth/sign-in", {
        layout: "auth",
        title: "Sign In",
        returnUrl: req.query.returnUrl || "/",
        message: "Please login to continue",
    });
};

// [POST] /sign-in/
module.exports.authenticate = async (req, res) => {
    const formData = req.body;
    const returnUrl = req.body.returnUrl || "/";

    try {
        const user = await User.signin(formData.email, formData.password);
        const token = createToken(user._id);
        res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

        // Redirect to the return URL if it exists
        res.redirect(returnUrl);
    } catch (err) {
        console.log("Login error:", err.message);
        const errors = errorHandler(err);
        res.render("auth/sign-in", {
            layout: "auth",
            title: "Sign In",
            errors,
            returnUrl,
            formData: {
                email: formData.email,
                password: "",
            },
        });
    }
};

// [GET] /sign-up/
module.exports.showSignUp = (req, res) => {
    res.render("auth/sign-up", {
        layout: "auth",
        title: "Sign Up",
    });
};

// [POST] /sign-up/
module.exports.createUser = (req, res) => {
    const newUserdata = req.body;
    const user = new User(newUserdata);
    user.save()
        .then(() => {
            const token = createToken(user._id);
            res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
            res.json({ user: user._id });
        })
        .catch((err) => {
            const errors = errorHandler(err);
            console.log(errors.email);
            res.render("auth/sign-up", {
                layout: "auth",
                title: "Sign Up",
                errors,
                newUserdata,
            });
        });
};

module.exports.logOut = (req, res) => {
    res.cookie("jwt", "", { maxAge: 1 });
    res.redirect("/");
};

// Thêm route này chỉ trong môi trường development
module.exports.resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Resetting password for email:", email);

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update directly in database to bypass middleware
        await User.updateOne({ email }, { $set: { password: hashedPassword } });

        console.log("Password reset successful");

        if (req.xhr || req.headers.accept.indexOf("json") > -1) {
            return res.json({ message: "Password reset successful" });
        }

        // Redirect to login page with success message
        req.flash("success", "Password reset successful. Please login again.");
        res.redirect("/sign-in");
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ error: "Unable to reset password" });
    }
};

// Thêm controller này
module.exports.showResetPassword = (req, res) => {
    res.render("auth/reset-password", {
        layout: "auth",
        title: "Reset Password",
    });
};
