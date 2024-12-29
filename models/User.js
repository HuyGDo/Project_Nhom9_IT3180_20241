//models/User.js
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Please enter your email."],
            unique: true,
            validate: [validator.isEmail, "Please enter a valid email."],
        },
        username: {
            type: String,
            default: null,
        },
        password: {
            type: String,
            required: [true, "Please enter your password"],
            minlength: [8, "Minium password length is 8 characters."],
        },
        first_name: {
            type: String,
            required: [true, "Please enter your first name."],
        },
        last_name: {
            type: String,
            required: [true, "Please enter your last name."],
        },
        role: {
            type: String,
            enum: ["user", "admin", "chef"],
            default: "user",
        },
        profile_picture: {
            type: String,
            default: "/assets/img/avatar.jpg",
        },
        bio: {
            type: String,
            default: "",
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
        //subscription
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
    },
);

// Remove author field from schema since it's causing confusion
// and keep only the virtual fields
delete userSchema.obj.author;

// Add virtual field for recipes
userSchema.virtual("recipes", {
    ref: "Recipe",
    localField: "_id",
    foreignField: "author",
    justOne: false,
});

// Add virtual field for blogs
userSchema.virtual("blogs", {
    ref: "Blog",
    localField: "_id",
    foreignField: "author",
    justOne: false,
});

// fire a function after doc saved to db
userSchema.post("save", function (doc, next) {
    console.log("New user was created and saved", doc);
    next();
});

// fire a function before doc saved to db
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        console.error("Lỗi khi hash password:", error);
        next(error);
    }
});

userSchema.methods.checkPassword = async function (password) {
    try {
        console.log("=== Password Debug Information ===");
        console.log("Input password:", password);
        console.log("Stored hashed password:", this.password);
        const isMatch = await bcrypt.compare(password, this.password);
        console.log("Password match result:", isMatch);
        return isMatch;
    } catch (error) {
        console.error("Detailed error:", error);
        return false;
    }
};

userSchema.statics.signin = async function (email, password) {
    try {
        const user = await this.findOne({ email });

        if (!user) {
            throw Error("Incorrect email.");
        }

        console.log("Checking password for user:", email);
        const isMatch = await user.checkPassword(password);

        if (!isMatch) {
            throw Error("Incorrect password.");
        }

        return user;
    } catch (error) {
        console.error("Error during signin:", error);
        throw error;
    }
};

// Instance method for subscribing to another user
userSchema.methods.follow = async function (targetUserId) {
    if (!this.following.includes(targetUserId)) {
        this.following.push(targetUserId);
        await this.save();

        const targetUser = await this.model("User").findById(targetUserId);
        if (!targetUser.followers.includes(this._id)) {
            targetUser.followers.push(this._id);
            await targetUser.save();
        }
    }
};

// Instance method for unsubscribing from another user
userSchema.methods.unfollow = async function (targetUserId) {
    this.following = this.following.filter((id) => id.toString() !== targetUserId.toString());
    await this.save();

    const targetUser = await this.model("User").findById(targetUserId);
    targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== this._id.toString(),
    );
    await targetUser.save();
};

module.exports = mongoose.model("User", userSchema);
