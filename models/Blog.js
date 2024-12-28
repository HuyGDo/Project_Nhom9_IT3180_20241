const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);

// Define the comment schema (embedded)
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

// Define the blog schema
const blogSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Blog title is required"],
        },
        content: {
            type: String,
            required: [true, "Blog content is required"],
        },
        description: {
            type: String,
            required: [true, "Blog description is required"],
        },
        image: {
            type: String,
            default: null,
        },
        category: {
            type: String,
            enum: ["cooking-tips", "food-culture", "health", "reviews", "other"],
            default: "other",
        },
        tags: [
            {
                type: String,
            },
        ],
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "published",
        },
        comments: [commentSchema],
        views: {
            type: Number,
            default: 0,
        },
        votes: {
            upvotes: { type: Number, default: 0 },
            downvotes: { type: Number, default: 0 },
            score: { type: Number, default: 0 },
        },
        userVotes: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                voteType: {
                    type: String,
                    enum: ["up", "down"],
                    required: true,
                },
            },
        ],
        readTime: {
            type: Number, // in minutes
            default: 5,
        },
        slug: {
            type: String,
            slug: "title",
            unique: true,
        },
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
    },
);

// Add virtual to check if user has voted
blogSchema.virtual("userVoted").get(function () {
    if (!this._user) return { up: false, down: false };

    const userVote = this.userVotes.find(
        (vote) => vote.user.toString() === this._user._id.toString(),
    );

    return {
        up: userVote?.voteType === "up",
        down: userVote?.voteType === "down",
    };
});

// Pre-save middleware to calculate read time
blogSchema.pre("save", function (next) {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / wordsPerMinute);
    next();
});

module.exports = mongoose.model("Blog", blogSchema);
