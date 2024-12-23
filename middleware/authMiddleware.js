const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

module.exports.checkLoggedIn = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        try {
            const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decodedToken.id).lean();

            if (user) {
                req.user = user;
                res.locals.user = user;
                res.locals.isAuthenticated = true;
            } else {
                res.locals.isAuthenticated = false;
            }
        } catch (err) {
            console.log("Token verification failed:", err.message);
            res.locals.isAuthenticated = false;
            res.clearCookie("jwt");
        }
    } else {
        res.locals.isAuthenticated = false;
    }
    next();
};

module.exports.requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    console.log("requireAuth Middleware - JWT Token:", token);

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                console.log("JWT Verification Error:", err.message);
                res.redirect("/sign-in");
            } else {
                console.log("JWT Decoded Token:", decodedToken);
                try {
                    req.user = await User.findById(decodedToken.id);
                    next();
                } catch (err) {
                    console.log("User Find Error:", err.message);
                    res.redirect("/sign-in");
                }
            }
        });
    } else {
        console.log("No JWT Token Found");
        res.redirect("/sign-in");
    }
};

module.exports.checkUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodeToken) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                let user = await User.findById(decodeToken.id).lean();
                res.locals.user = user;
                next();
            }
        });
    } else {
        console.log("No JWT Token Found in checkUser");
        res.locals.user = null;
        next();
    }
};

module.exports.setCurrentUser = (req, res, next) => {
    req.user = req.session.user;
    next();
};
