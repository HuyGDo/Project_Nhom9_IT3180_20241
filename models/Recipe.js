const mongoose = require('mongoose');

// Define the review schema (embedded)
const reviewSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the user who wrote the review
    required: true,
    ref: 'User' // Assuming there is a User model for user accounts
  },
  comments: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define the recipe schema
const recipeSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the recipe
    required: true,
    ref: 'User' // Assuming there is a User model
  },
  recipe_title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  ingredients: [
    {
      name: {
        type: String,
        required: true
      },
      quantity: String
    }
  ],
  instructions: [
    {
      stepNumber: Number,
      description: {
        type: String,
        required: true
      }
    }
  ],
  image: {
    type: String // Store URL or path to the image
  },
  reviews: [reviewSchema], // Embed reviews directly into the recipe
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Export the Recipe model
module.exports = mongoose.model('Recipe', recipeSchema);
