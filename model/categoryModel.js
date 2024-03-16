const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const CategorySchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: [true, 'Name of category is required'],
            maxlength: [100, 'Category name should be less than 100 character'],
            unique: true,
        },
        categoryImage: String,
        order: {
            type: Number,
            default: 0,
        },
        slug: { type: String, slug: 'categoryName' },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

CategorySchema.virtual('amountProducts', {
    ref: 'Product',
    foreignField: 'category',
    localField: 'slug',
    count: true,
});

CategorySchema.pre(/^find/, function (next) {
    this.select('-__v -createdAt -updatedAt');
    next();
});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
