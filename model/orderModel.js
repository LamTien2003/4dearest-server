const mongoose = require('mongoose');
const validator = require('validator');

const { EnumPaymentMethod, shippingType } = require('../constants/index');

const OrderSchema = new mongoose.Schema(
    {
        paymentId: {
            type: String,
            required: [true, 'Must have Payment ID'],
        },
        trackingInfo: {
            type: {
                shippingCarrier: String,
                trackingID: String,
            },
            default: null,
        },
        paymentMethod: {
            type: String,
            enum: {
                values: Object.values(EnumPaymentMethod),
                message: 'Payment method is not valid',
            },
            required: [true, 'Payment method is required field'],
        },
        shippingMethod: {
            type: String,
            enum: {
                values: Object.values(shippingType),
                message: 'Shipping method is not valid',
            },
            required: [true, 'Shipping method is required field'],
        },
        isFulfilled: {
            type: Boolean,
            default: false,
        },
        couponUsed: {
            type: String,
            default: null,
        },
        isSendingPromotionMail: {
            type: Boolean,
            default: false,
        },
        paymentInfo: {
            type: {
                totalProductsPrice: Number,
                shippingFee: Number,
                priceDiscounted: Number,
                shippingFeeDiscounted: Number,
                totalPayment: Number,
            },
            required: [true, 'Payment info of this order is required'],
        },
        logisticInfo: {
            type: {
                fullName: {
                    type: String,
                    required: [true, 'Name contact of receiver is required'],
                },
                country: {
                    type: String,
                    required: [true, 'Country is required'],
                    maxlength: [20, 'Country should be less than 20 character'],
                },
                postalCode: {
                    type: Number,
                    required: [true, 'Postal Code is required'],
                },
                city: {
                    type: String,
                    required: [true, 'City is required'],
                    maxlength: [50, 'City should be less than 50 character'],
                },
                state: {
                    type: String,
                    maxlength: [200, 'State should be less than 100 character'],
                },
                address: {
                    type: String,
                    required: [true, 'Address is required'],
                    maxlength: [200, 'Address should be less than 200 character'],
                },
                department: {
                    type: String,
                    maxlength: [150, 'Department should be less than 150 character'],
                },
                mobileNumber: {
                    type: String,
                },
                email: {
                    type: String,
                    required: [true, 'Please provide your email'],
                    validate: [validator.isEmail, 'Please provide a valid email'],
                },
            },
        },
        products: {
            type: [
                {
                    product_id: {
                        type: mongoose.Schema.ObjectId,
                        ref: 'ProductDetail',
                    },
                    product_name: String,
                    variants: {
                        type: [
                            {
                                image: String,
                                sku: String,
                                amount: Number,
                                price: Number,
                                color: {
                                    label: String,
                                    colorCode: String,
                                },
                            },
                        ],
                        default: undefined,
                        required: [true, 'Must have variant of product'],
                    },
                },
            ],
            required: [true, 'Order must have product'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

OrderSchema.pre(/^find/, function (next) {
    this.select('-__v');
    next();
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
