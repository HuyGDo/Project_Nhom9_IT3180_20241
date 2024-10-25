const defaultRouter = require("./defaultRouters");
const recipesRouter = require("./recipeRouters");
const meRouter = require("./meRouters");
const authRouter = require("./authRouters");
const { checkUser } = require("../middleware/authMiddleware");

module.exports = (app) => {
    app.get("*", checkUser);
    app.use("/", defaultRouter);
    app.use("/me", meRouter);
    app.use("/recipes", recipesRouter);
    app.use(authRouter);
};
