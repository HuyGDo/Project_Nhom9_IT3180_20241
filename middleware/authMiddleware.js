const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/configuration");

module.exports.requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    console.log("requireAuth Middleware - JWT Token:", token);

    if (token) {
        jwt.verify(token, config.JWT_SECRET, async (err, decodedToken) => {
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

// Use for voting
module.exports.requireAuthAPI = (req, res, next) => {
    const token = req.cookies.jwt;
    console.log("requireAuthAPI Middleware - JWT Token:", token);
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Please login to perform this action'
        });
    }

    jwt.verify(token, config.JWT_SECRET, async (err, decodedToken) => {
        try {
            if (err) {
                console.log("JWT Verification Error in API:", err.message);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid session'
                });
            }
            
            const user = await User.findById(decodedToken.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            req.user = user;
            next();
        } catch (error) {
            console.error("API Auth Error:", error);
            return res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    });
};


module.exports.checkUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, config.JWT_SECRET, async (err, decodeToken) => {
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

