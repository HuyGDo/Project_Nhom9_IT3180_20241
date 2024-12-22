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
    notification_preferences: {
        email_notifications: {
            type: Boolean,
            default: true,
        },
        web_notifications: {
            type: Boolean,
            default: true,
        },
    },
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

userSchema.methods.follow = async function (userId) {
    if (this._id.equals(userId)) return;

    if (!this.following.includes(userId)) {
        this.following.push(userId);

        const userToFollow = await this.model("User").findById(userId);
        if (userToFollow && !userToFollow.followers.includes(this._id)) {
            userToFollow.followers.push(this._id);
            await userToFollow.save();
        }

        await this.save();
        return true; // Successfully followed
    }
    return false; // Already following
};

userSchema.methods.unfollow = async function (userId) {
    this.following = this.following.filter((id) => !id.equals(userId));

    const userToUnfollow = await this.model("User").findById(userId);
    if (userToUnfollow) {
        userToUnfollow.followers = userToUnfollow.followers.filter((id) => !id.equals(this._id));
        await userToUnfollow.save();
    }

    await this.save();
};

module.exports = mongoose.model("User", userSchema);
