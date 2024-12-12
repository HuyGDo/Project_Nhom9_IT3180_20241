// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports.requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    console.log("requireAuth Middleware - JWT Token:", token);

    // Check if JWT exists & is verified
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decodeToken) => {
            if (err) {
                console.log("JWT Verification Error:", err.message);
                res.redirect("/sign-in");
            } else {
                console.log("JWT Decoded Token:", decodeToken);
                next();
            }
        });
    } else {
        console.log("No JWT Token Found");
        res.redirect("/sign-in");
    }
};

module.exports.checkUser = (req, res, next) => {
    const token = req.cookies.jwt;
    console.log("checkUser Middleware - JWT Token:", token);

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodeToken) => {
            if (err) {
                console.log("JWT Verification Error in checkUser:", err.message);
                res.locals.user = null;
                next();
            } else {
                console.log("JWT Decoded Token in checkUser:", decodeToken);
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
