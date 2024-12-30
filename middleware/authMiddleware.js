const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();
const notificationService = require("../services/notificationService");

const getTokenFromRequest = (req) => {
    // Check cookie first
    const cookieToken = req.cookies.jwt;
    if (cookieToken) return cookieToken;

    // Then check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }

    return null;
};

// Create a single exports object
const middleware = {
    checkLoggedIn: async (req, res, next) => {
        const token = getTokenFromRequest(req);

        if (token) {
            try {
                const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decodedToken.id).lean();

                if (user) {
                    req.user = user;
                    res.locals.user = user;
                    res.locals.isAuthenticated = true;

                    // Get unread notifications count and recent notifications
                    try {
                        const unreadCount = await notificationService.getUnreadCount(user._id);
                        const notifications = await notificationService.getUserNotifications(
                            user._id,
                            5,
                        );

                        res.locals.unreadNotifications = unreadCount;
                        res.locals.notifications = notifications;
                    } catch (error) {
                        console.error("Error fetching notifications:", error);
                        res.locals.unreadNotifications = 0;
                        res.locals.notifications = [];
                    }
                } else {
                    res.locals.isAuthenticated = false;
                    res.locals.user = null;
                }
            } catch (err) {
                console.log("Token verification failed:", err.message);
                res.locals.isAuthenticated = false;
                res.locals.user = null;
                res.clearCookie("jwt");
            }
        } else {
            res.locals.isAuthenticated = false;
            res.locals.user = null;
        }
        next();
    },

    requireAuth: async (req, res, next) => {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.redirect("/sign-in");
        }

        try {
            const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decodedToken.id);

            if (!user) {
                res.clearCookie("jwt");
                return res.redirect("/sign-in");
            }

            req.user = user;
            next();
        } catch (err) {
            console.error("Authentication error:", err.message);
            res.clearCookie("jwt");
            return res.redirect("/sign-in");
        }
    },

    checkUser: async (req, res, next) => {
        const token = getTokenFromRequest(req);

        if (token) {
            try {
                const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decodedToken.id).lean();

                if (user) {
                    req.user = user;
                    res.locals.user = user;
                    res.locals.isAuthenticated = true;
                } else {
                    res.locals.user = null;
                    res.locals.isAuthenticated = false;
                }
            } catch (err) {
                res.locals.user = null;
                res.locals.isAuthenticated = false;
            }
        } else {
            res.locals.user = null;
            res.locals.isAuthenticated = false;
        }
        next();
    },

    setCurrentUser: (req, res, next) => {
        res.locals.currentUser = req.user;
        next();
    },

    requireAdmin: (req, res, next) => {
        if (req.user && req.user.role === "admin") {
            next();
        } else {
            res.redirect("/");
        }
    },
};

module.exports = middleware;
