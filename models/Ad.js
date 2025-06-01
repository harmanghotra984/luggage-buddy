const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Ad type is required'],
        enum: {
            values: ['have-space', 'need-space'],
            message: 'Ad type must be either have-space or need-space'
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    flightNumber: {
        type: String,
        required: [true, 'Flight number is required'],
        trim: true
    },
    flightDetails: {
        type: String,
        required: [true, 'Flight details are required'],
        trim: true
    },
    availableSpace: {
        type: Number,
        required: function() {
            return this.type === 'have-space';
        },
        min: [1, 'Available space must be at least 1 kg'],
        max: [50, 'Available space cannot exceed 50 kg']
    },
    requiredSpace: {
        type: Number,
        required: function() {
            return this.type === 'need-space';
        },
        min: [1, 'Required space must be at least 1 kg'],
        max: [50, 'Required space cannot exceed 50 kg']
    },
    pricePerKg: {
        type: Number,
        required: function() {
            return this.type === 'have-space';
        },
        min: [1, 'Price per kg must be at least ₹1']
    },
    maxBudget: {
        type: Number,
        required: function() {
            return this.type === 'need-space';
        },
        min: [1, 'Maximum budget must be at least ₹1']
    },
    flightDate: {
        type: Date,
        required: [true, 'Flight date is required'],
        validate: {
            validator: function(date) {
                return date > new Date();
            },
            message: 'Flight date must be in the future'
        }
    },
    additionalInfo: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        required: function() {
            return this.type === 'need-space';
        }
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'matched', 'completed', 'cancelled'],
            message: 'Status must be one of: active, matched, completed, cancelled'
        },
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
adSchema.index({ type: 1, status: 1 });
adSchema.index({ flightDate: 1 });
adSchema.index({ userId: 1 });

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad; 