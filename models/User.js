//models/User.js
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
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
});

// fire a function after doc saved to db
userSchema.post("save", function (doc, next) {
    console.log("New user was created and saved", doc);
    next();
});

// fire a function before doc saved to db
userSchema.pre("save", async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.statics.signin = async function (email, password) {
    const user = await this.findOne({ email: email });
    if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
            return user;
        }
        throw Error("Incorrect password.");
    }
    throw Error("Incorrect email.");
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
