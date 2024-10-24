const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true},
    role: { type: String, enum: ['user', 'admin', 'chef'], default: 'user'},
    profile_picture: { type: String }
},{
    collection: 'User',
    timestamps: true
});
            
module.exports = mongoose.model('User', Userschema);