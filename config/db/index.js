const mongoose = require("mongoose");
const { mongoDBUrl } = require("../configuration");

async function connect() {
    try {
        await mongoose.connect(mongoDBUrl);
        console.log("Connected to the database successfully!");
    } catch (error) {
        console.log("Database connection failure:", error);
    }
}

module.exports = { connect };
