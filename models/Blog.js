const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Blog = new Schema({
    author: {type: String},
    content: {type: String},
    title: {type: String},
    downvotes: { 
        type: Number,
        min: 0, // Không cho phép giá trị âm
    },
    upvotes: { 
        type: Number,
        min: 0, // Không cho phép giá trị âm
    },
    slug: { type: String, unique: true }
});

module.exports = mongoose.model('Blog',Blog);