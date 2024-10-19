const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recipeSchema = new Schema({
    recipe_title: { type: String },
    description: { type: String },
    image: { type: String },
});

module.exports = mongoose.model("Recipe", recipeSchema, "recipes");

// Mongoose.model(name, [schema], [collection], [skipInit])

// Defines a model or retrieves it.

// Parameters:

// 1st param - name <String> model name
// 2nd param - [schema] <Schema> schema name
// 3rd param - [collection] <String> collection name (optional, induced from model name)
// 4th param - [skipInit] <Boolean> whether to skip initialization (defaults to false)
