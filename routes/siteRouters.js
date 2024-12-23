// routes/siteRouters.js
const defaultRouter = require("./defaultRouters");
const recipesRouter = require("./recipeRouters");
const meRouter = require("./meRouters");
const authRouter = require("./authRouters");
const { checkUser } = require("../middleware/authMiddleware");
const adminRouter = require("./adminRouters");
const userRouter = require("./userRouters");

module.exports = (app) => {
    //app.use("*", checkUser); // Apply to all routes and methods
    app.use("/", defaultRouter);
    app.use("/", authRouter);
    app.use("/me", meRouter);
    app.use("/users", userRouter);
    app.use("/recipes", recipesRouter);
    app.use("/admin", adminRouter);
};
