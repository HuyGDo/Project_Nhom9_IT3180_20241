const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);

const commentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Define the recipe schema
const recipeSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Recipe title is required"],
        },
        description: {
            type: String,
            required: [true, "Recipe description is required"],
        },
        prepTime: {
            type: Number,
            required: [true, "Preparation time is required"],
            min: [0, "Preparation time cannot be negative"],
        },
        cookTime: {
            type: Number,
            required: [true, "Cooking time is required"],
            min: [0, "Cooking time cannot be negative"],
        },
        servings: {
            type: Number,
            required: [true, "Number of servings is required"],
            min: [1, "Number of servings must be at least 1"],
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            required: true,
        },
        ingredients: [
            {
                _id: false,
                name: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: String,
                    required: true,
                },
            },
        ],
        instructions: [
            {
                _id: false,
                description: {
                    type: String,
                    required: true,
                },
            },
        ],
        image: {
            type: String, // Store URL or path to the image
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        votes: {
            upvotes: { type: Number, default: 0 },
            downvotes: { type: Number, default: 0 },
            score: { type: Number, default: 0 },
        },
        views: {
            type: Number,
            default: 0,
        },
        userVotes: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                voteType: { type: String, enum: ["up", "down"] },
            },
        ],
        slug: { type: String, slug: "title", unique: true },
        comments: [commentSchema],
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
    },
);

// Add text indexes for search
recipeSchema.index({
    title: 'text',
    description: 'text',
    'ingredients.name': 'text',
    'instructions.description': 'text'
});

// Add virtual to check if user has voted
recipeSchema.virtual("userVoted").get(function () {
    if (!this._user) return { up: false, down: false };

    const userVote = this.userVotes.find(
        (vote) => vote.user.toString() === this._user._id.toString(),
    );

    return {
        up: userVote?.voteType === "up",
        down: userVote?.voteType === "down",
    };
});

// Export the Recipe model
module.exports = mongoose.model("Recipe", recipeSchema);
// Mongoose.model(name, [schema], [collection], [skipInit])

// Parameters:

// 1st param - name <String> model name
// 2nd param - [schema] <Schema> schema name
// 3rd param - [collection] <String> collection name (optional, induced from model name)
// 4th param - [skipInit] <Boolean> whether to skip initialization (defaults to false)
