const fuzzball = require("fuzzball");
const Recipe = require("../models/Recipe");
const Blog = require("../models/Blog");

class RecommendationService {
    static async getRecommendedRecipes(currentRecipe, limit = 4) {
        try {
            // Get all other recipes except current one
            const allRecipes = await Recipe.find({
                _id: { $ne: currentRecipe._id },
            })
                .populate("author", "username first_name last_name profile_picture")
                .lean();

            console.log("Fetched all recipes:", allRecipes.length);

            // Calculate similarity scores
            const scoredRecipes = allRecipes.map((recipe) => {
                const titleScore = fuzzball.ratio(
                    currentRecipe.title.toLowerCase(),
                    recipe.title.toLowerCase(),
                );
                const descScore = fuzzball.ratio(
                    currentRecipe.description.toLowerCase(),
                    recipe.description.toLowerCase(),
                );

                // Calculate ingredient similarity
                const ingredientScores = currentRecipe.ingredients.map((ing1) => {
                    return Math.max(
                        ...recipe.ingredients.map((ing2) =>
                            fuzzball.ratio(ing1.name.toLowerCase(), ing2.name.toLowerCase()),
                        ),
                    );
                });
                const ingredientScore =
                    ingredientScores.reduce((a, b) => a + b, 0) / ingredientScores.length;

                // Weighted average of different scores
                const totalScore = titleScore * 0.3 + descScore * 0.3 + ingredientScore * 0.4;

                return {
                    ...recipe,
                    similarityScore: totalScore,
                };
            });

            // Sort by similarity score and return top N
            return scoredRecipes
                .sort((a, b) => b.similarityScore - a.similarityScore)
                .slice(0, limit);
        } catch (error) {
            console.error("Error getting recipe recommendations:", error);
            return [];
        }
    }

    static async getRecommendedBlogs(currentBlog, limit = 4) {
        try {
            // Get all other blogs except current one
            const allBlogs = await Blog.find({
                _id: { $ne: currentBlog._id },
                status: "published",
            })
                .populate("author", "username first_name last_name profile_picture")
                .lean();

            // Calculate similarity scores
            const scoredBlogs = allBlogs.map((blog) => {
                const titleScore = fuzzball.ratio(
                    currentBlog.title.toLowerCase(),
                    blog.title.toLowerCase(),
                );
                const descScore = fuzzball.ratio(
                    currentBlog.description.toLowerCase(),
                    blog.description.toLowerCase(),
                );
                const categoryScore = currentBlog.category === blog.category ? 100 : 0;

                // Calculate tag similarity
                const tagScores = currentBlog.tags.map((tag1) => {
                    return Math.max(
                        ...blog.tags.map((tag2) =>
                            fuzzball.ratio(tag1.toLowerCase(), tag2.toLowerCase()),
                        ),
                    );
                });
                const tagScore = tagScores.length
                    ? tagScores.reduce((a, b) => a + b, 0) / tagScores.length
                    : 0;

                // Weighted average of different scores
                const totalScore =
                    titleScore * 0.3 + descScore * 0.2 + categoryScore * 0.3 + tagScore * 0.2;

                return {
                    ...blog,
                    similarityScore: totalScore,
                };
            });

            // Sort by similarity score and return top N
            return scoredBlogs
                .sort((a, b) => b.similarityScore - a.similarityScore)
                .slice(0, limit);
        } catch (error) {
            console.error("Error getting blog recommendations:", error);
            return [];
        }
    }
}

module.exports = RecommendationService;
