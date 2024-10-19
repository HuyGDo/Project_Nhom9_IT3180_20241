const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect('mongodb://localhost:27017/BussinCookin');
        console.log('Database connect successfully!');
    } catch (error) {
        console.log('Database connect failed!');
    }
}

module.exports = { connect };
