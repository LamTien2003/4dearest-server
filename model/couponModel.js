const dayjs = require('dayjs');
const mongoose = require('mongoose');

const ConditionSchema = new mongoose.Schema({
    minTotalPricePayment: {
        type: Number,
        default: 0,
    },
    maxTotalPricePayment: {
        type: Number,
        default: null,
    },
    productsForUse: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
        },
    ],
});

const EffectSchema = new mongoose.Schema({
    applyTo: {
        type: String,
        enum: ['order', 'shipping'],
        required: [true, 'Must have type of coupon discount'],
    },
    type: {
        type: String,
        enum: ['fixed', 'percent'],
        required: [true, 'Must have type of coupon discount'],
    },
    discountPercent: {
        type: Number,
        default: 0,
    },
    discountAmount: {
        type: Number,
        default: 0,
    },
    maximumDiscount: {
        type: Number,
        default: function () {
            return this.discountAmount;
        },
    },
});

const CouponSchema = new mongoose.Schema(
    {
        couponName: {
            type: String,
            required: [true, 'Coupon name is required'],
            maxlength: [150, 'Coupon name should be less than 150 character'],
        },
        couponDescription: {
            type: String,
            required: [true, 'Coupon description is required'],
            maxlength: [150, 'Coupon description should be less than 150 character'],
        },
        couponCode: {
            type: String,
            unique: true,
            required: [true, 'Coupon code is required'],
            maxlength: [15, 'Coupon code should be less than 15 character'],
        },
        startDate: {
            type: Date,
            required: [true, 'Coupon start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'Coupon end date is required'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity of coupon is required'],
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        conditions: ConditionSchema,
        effects: EffectSchema,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    },
);

CouponSchema.pre(/^find/, function (next) {
    this.select('-__v');
    next();
});

const Coupon = mongoose.model('Coupon', CouponSchema);

module.exports = Coupon;
