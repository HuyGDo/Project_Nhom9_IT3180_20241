const mongoose = require("mongoose");
const { mongoDBUrl } = require("../configuration");

async function connect() {
    try {
        await mongoose.connect(mongoDBUrl);
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

module.exports = { connect };
