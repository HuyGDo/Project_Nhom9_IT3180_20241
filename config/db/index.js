const mongoose = require('mongoose');
const { mongoDBUrl } = require('../configuration');

async function connect(){
    try {
        await mongoose.connect(mongoDBUrl);
        console.log("Connected to the DB successfully!");
    } catch (error) {
        console.log("Connection failure!: ", error);
    }
}