const User = require("../models/User");
const jwt = require("jsonwebtoken");

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

const maxAge = 24 * 60 * 60; // 1 days
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
    });
};

// [POST] /sign-in/
module.exports.authenticate = async (req, res) => {
    const formData = req.body;
    console.log("Form data:", formData);

    try {
        const user = await User.signin(formData.email, formData.password);
        console.log("User found:", user);
        const token = createToken(user._id);

        res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.redirect("/");
    } catch (err) {
        console.log("Authentication error:", err);
        const errors = errorHandler(err);
        res.render("auth/sign-in", {
            layout: "auth",
            title: "Sign In",
            errors,
            formData,
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

// const mongoose = require("mongoose");

// // Function to check if the index on 'username' exists and remove it
// async function removeUsernameIndexIfExists() {
//     try {
//         // List all indexes on the 'users' collection
//         const indexes = await User.collection.indexes();

//         // Check if there's an index on the 'username' field
//         const usernameIndex = indexes.find((index) => index.key && index.key.username);

//         if (usernameIndex) {
//             console.log("Found index on 'username': ${usernameIndex.name}. Removing it...");

//             // Drop the index
//             await User.collection.dropIndex(usernameIndex.name);

//             console.log("Index '${usernameIndex.name}' on 'username' has been removed.");
//         } else {
//             console.log('No index found on "username".');
//         }
//     } catch (error) {
//         console.error("Error checking or removing index:", error);
//     }
// }

// // Call the function
// removeUsernameIndexIfExists();
