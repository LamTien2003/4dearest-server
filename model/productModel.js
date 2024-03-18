const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');

const ProductDetailSchema = require('../model/productDetailModel');

mongoose.plugin(slug);

const ProductSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: [true, 'Category of product is required'],
        },
        title: {
            type: String,
            required: [true, 'Title of product is required'],
            maxlength: [150, 'Title of product should be less than 150 character'],
            unique: [true, 'This product is existed'],
        },
        subTitle: {
            type: String,
            maxlength: [100, 'Sub Title of product should be less than 100 character'],
        },
        description: {
            type: String,
            required: [true, 'Description of product is required'],
            maxlength: [10000, 'Description of product should be less than 1000 character'],
        },
        imagesProduct: [String],
        imageChart: String,
        additionalInfo: {
            type: Object,
        },
        variants: {
            type: [ProductDetailSchema],
            required: [true, 'Must have at least 1 variant for product'],
            default: undefined,
        },
        hotOrder: Number,
        tags: [String],
        isPublic: {
            type: Boolean,
            default: true,
        },

        slug: { type: String, slug: 'title' },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

ProductSchema.virtual('price').get(function () {
    return this.variants[0].discountPrice;
});
ProductSchema.virtual('sold').get(function () {
    const variants = JSON.parse(JSON.stringify(this.variants));
    return variants.reduce((total, current) => total + current.soldItems, 0);
});

ProductSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'product',
    localField: '_id',
    default: [],
    match: { isAccepted: true },
});

ProductSchema.pre(/^find/, function (next) {
    this.select('-__v');
    next();
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
