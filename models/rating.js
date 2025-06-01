const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true
  }
}, {
  timestamps: true
});

// Prevent duplicate ratings
ratingSchema.index({ rater: 1, ratee: 1, chatId: 1 }, { unique: true });

// Static method to calculate average rating for a user
ratingSchema.statics.calculateAverageRating = async function(userId) {
  try {
    // Create a proper ObjectId using the 'new' keyword
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const result = await this.aggregate([
      { $match: { ratee: userObjectId } },
      { 
        $group: { 
          _id: '$ratee', 
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    return result.length > 0 ? 
      { averageRating: result[0].averageRating, totalRatings: result[0].totalRatings } : 
      { averageRating: 0, totalRatings: 0 };
  } catch (err) {
    console.error("Error calculating average rating:", err);
    return { averageRating: 0, totalRatings: 0 };
  }
};

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating; 