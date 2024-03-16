const mongoose = require('mongoose');

const ProductDetailSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: [true, 'Sku of this variant Product is required'],
    },
    color: {
        type: {
            label: String,
            colorCode: String,
        },
        required: [true, 'Color of Product is required'],
        maxlength: [20, 'Color of Product should be less than 20 character'],
    },
    initialPrice: {
        type: Number,
        required: [true, 'Price of Product is required'],
    },
    discountPrice: {
        type: Number,
        validate: {
            // This only works on CREATE and SAVE!!! EVEN IF use options new and runValidator in findAndUpdate
            validator: function (value) {
                return value <= this.initialPrice;
            },
            message: 'Discount price cannot be exceeded the original price',
        },
        default: function () {
            return this.initialPrice;
        },
    },
    inventory: {
        type: Number,
        required: [true, 'Inventory of Product is required'],
    },
    soldItems: {
        type: Number,
        default: 0,
    },
    indexImageDisplay: {
        type: Number,
        required: [true, 'Image president for Product is required'],
    },
});

ProductDetailSchema.pre(/^find/, function (next) {
    this.select('-__v -createdAt -updatedAt');
    next();
});

module.exports = ProductDetailSchema;
