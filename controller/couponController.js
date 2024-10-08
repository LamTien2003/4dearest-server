const catchAsync = require('../utils/catchAsync');
const { sendResponseToClient } = require('../utils/utils');

const Coupon = require('../model/couponModel');

exports.createCoupon = catchAsync(async (req, res, next) => {
    const { couponName, couponCode, couponDescription, startDate, endDate, quantity, conditions, effects } = req.body;

    const couponCreated = await Coupon.create({
        couponName,
        couponCode,
        couponDescription,
        startDate,
        endDate,
        quantity,
        conditions,
        effects,
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: couponCreated,
    });
});

exports.getCouponsAvailable = catchAsync(async (req, res, next) => {
    const couponsAvailable = await Coupon.find({
        isActive: true,
        quantity: { $gt: 0 },
        startDate: { $lt: Date.now() },
        endDate: { $gt: Date.now() },
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: couponsAvailable || [],
    });
});
