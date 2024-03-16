const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'Comment must be belong to certain product'],
        },
        comment: {
            type: String,
            maxlength: [500, 'Comment for Product should be less than 500 character'],
        },
        commentImages: [String],
        customerName: {
            type: String,
            required: [true, 'Name of customer is required'],
            maxlength: [50, 'Customer name should be less than 50 character'],
        },
        rateStar: {
            type: Number,
            min: 1,
            max: 5,
            default: 5,
        },
        isAccepted: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    },
);

ReviewSchema.pre(/^find/, function (next) {
    this.select('-__v');
    next();
});

const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;
