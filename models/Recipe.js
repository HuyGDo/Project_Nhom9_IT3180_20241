const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);

// Define the review schema (embedded)
const reviewSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the user who wrote the review
        ref: "User", // Assuming there is a User model for user accounts
    },
    comments: {
        type: String,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
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
            type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the recipe
            ref: "User", // Assuming there is a User model
            required: true,
        },
        title: {
            type: String,
        },
        description: {
            type: String,
        },
        ingredients: [
            {
                _id: false,
                name: {
                    type: String,
                },
                quantity: String,
            },
        ],
        instructions: [
            {
                _id: false,
                stepNumber: Number,
                description: {
                    type: String,
                },
            },
        ],
        image: {
            type: String, // Store URL or path to the image
        },
        reviews: [reviewSchema], // Embed reviews directly into the recipe
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
        userVotes: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                voteType: { type: String, enum: ["up", "down"] },
            },
        ],
        slug: { type: String, slug: "title", unique: true },
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
    },
);

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
