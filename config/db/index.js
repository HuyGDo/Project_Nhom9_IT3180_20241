const mongoose = require('mongoose');
const { mongoDBURL } = require('../configuration');

async function connect(){
    try {
        await mongoose.connect(mongoDBURL);
        console.log("Connected to the DB successfully!");
    } catch (error) {
        console.log("Connection failure!: ", error);
    }
}