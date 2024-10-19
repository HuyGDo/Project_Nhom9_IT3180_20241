const Recipe = require("../models/recipeModel");

// Controller function for rendering the home page
module.exports.show = async (req, res) => {
    try {
        // Get recipe data from the database
        const data = await Recipe.find().lean();

        // Render the home page with the recipe data
        res.render("home", {
            layout: "main",
            title: "Browse recipes",
            recipes: data,
        });
    } catch (error) {
        console.error("Error fetching recipes:", error);
        res.status(500).send("An error occurred while fetching recipes.");
    }
};
