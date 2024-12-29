const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();
const notificationService = require("../services/notificationService");

// Create a single exports object
const middleware = {
    checkLoggedIn: async (req, res, next) => {
        const token = req.cookies.jwt;

        if (token) {
            try {
                const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decodedToken.id).lean();

                if (user) {
                    req.user = user;
                    res.locals.user = user;
                    res.locals.isAuthenticated = true;

                    // Get unread notifications count and recent notifications
                    const unreadCount = await notificationService.getUnreadCount(user._id);
                    const notifications = await notificationService.getUserNotifications(
                        user._id,
                        5,
                    );

                    res.locals.unreadNotifications = unreadCount;
                    res.locals.notifications = notifications;
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
    },

    requireAuth: async (req, res, next) => {
        try {
            // Check token in cookies first
            let token = req.cookies.jwt;

            // If no cookie token, check Authorization header
            const authHeader = req.headers.authorization;
            if (!token && authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }

            if (!token) {
                console.log("No token found in cookies or auth header");
                return res.status(401).json({ error: "Authentication required" });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            const user = await User.findById(decoded.id);
            if (!user) {
                console.log("User not found for token");
                return res.status(401).json({ error: "User not found" });
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (error) {
            console.error("Auth middleware error:", error);
            res.status(401).json({ error: "Invalid token" });
        }
    },

    checkUser: async (req, res, next) => {
        try {
            let token = req.cookies.jwt;

            // Also check Authorization header
            const authHeader = req.headers.authorization;
            if (!token && authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }

            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                if (user) {
                    req.user = user;
                    res.locals.user = user;
                }
            }
            next();
        } catch (error) {
            console.error("CheckUser middleware error:", error);
            res.locals.user = null;
            req.user = null;
            next();
        }
    },

    setCurrentUser: (req, res, next) => {
        req.user = req.session.user;
        next();
    },
};

module.exports = middleware;
