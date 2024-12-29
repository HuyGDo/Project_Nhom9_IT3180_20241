// routes/siteRouters.js
const defaultRouter = require("./defaultRouters");
const recipesRouter = require("./recipeRouters");
const blogRouter = require("./blogRouters");
const authRouter = require("./authRouters");
const { checkUser } = require("../middleware/authMiddleware");
const adminRouter = require("./adminRouters");
const userRouter = require("./userRouters");
const RecommendationService = require('../services/recommendationService');

module.exports = (app) => {
    app.use("*", checkUser); // Apply to all routes and methods
    app.use("/", defaultRouter);
    app.use("/", authRouter);
    app.use("/users", userRouter);
    app.use("/recipes", recipesRouter);
    app.use("/blogs", blogRouter);
    app.use("/admin", adminRouter);

    // Thêm route cho recommendations
    app.get('/api/recommendations/:recipeId', async (req, res) => {
        try {
            const { recipeId } = req.params;
            const recommendations = await RecommendationService.getRecommendations(recipeId);
            res.json(recommendations);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({ error: 'Failed to get recommendations' });
        }
    });
};
