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

module.exports = mongoose.model("User", userSchema);
