const mongoose = require("mongoose");
const { mongoDBUrl } = require("../configuration");

async function connect() {
    try {
        await mongoose.connect(mongoDBUrl);
        console.log("Connected to MongoDB successfully!");
        
        // Test connection
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Available collections:", collections.map(c => c.name));
        
        // Test recipes collection
        const Recipe = mongoose.model('Recipe');
        const count = await Recipe.countDocuments();
        console.log(`Found ${count} recipes in database`);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

module.exports = { connect };
