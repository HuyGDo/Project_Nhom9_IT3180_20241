// routes/siteRouters.js
const express = require("express");
const router = express.Router();
const defaultRouter = require("./defaultRouters");
const recipesRouter = require("./recipeRouters");
const blogRouter = require("./blogRouters");
const authRouter = require("./authRouters");
const { checkUser } = require("../middleware/authMiddleware");
const adminRouter = require("./adminRouters");
const notificationRouters = require("./notificationRouters");
const userRouter = require("./userRouters");

module.exports = (app) => {
    app.use("*", checkUser); // Apply to all routes and methods
    app.use("/", defaultRouter);
    app.use("/", authRouter);
    app.use("/users", userRouter);
    app.use("/recipes", recipesRouter);
    app.use("/blogs", blogRouter);
    app.use("/admin", adminRouter);
    app.use("/notifications", notificationRouters);
};
