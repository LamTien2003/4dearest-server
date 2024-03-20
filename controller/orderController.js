const dayjs = require('dayjs');

const Coupon = require('../model/couponModel');
const Order = require('../model/orderModel');
const Product = require('../model/productModel');

const { shippingType, shippingMethods, EnumPaymentMethod } = require('../constants');
const { createOrder, capturePayment } = require('./paypalServiceController');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendResponseToClient } = require('../utils/utils');
const { sendOrderConfirmation, sendShippedConfirmation } = require('../utils/email');

const checkingAvailableProduct = async (checkingProduct) => {
    const { product_id, variants } = checkingProduct;
    const product = await Product.findOne({ _id: product_id, isPublic: true });

    if (!product) {
        throw 'Maybe some product in your cart is no longer exist. Please refresh and try again';
    }

    const totalPrice = variants.reduce((total, current) => {
        const detailProduct = product.variants.find((item) => item.sku === current.sku);
        if (!detailProduct) {
            throw 'This variant of product is not exist';
        }
        if (Number(current.price) !== Number(detailProduct.discountPrice)) {
            throw 'Perhaps there have been changes in product prices along the way. Please refresh and try again';
        }
        if (Number(detailProduct.inventory) < Number(current.amount)) {
            throw 'The selected product is no longer in stock';
        }

        return total + current.price * current.amount;
    }, 0);
    return totalPrice;
};

const applyDiscountEffect = (effect, price) => {
    const { type, discountPercent, discountAmount, maximumDiscount } = effect;
    let discountedPrice = 0;
    let priceAfterDiscount = 0;

    if (type === 'fixed') {
        discountedPrice = discountAmount > maximumDiscount ? maximumDiscount : discountAmount;
        priceAfterDiscount = Number(price) - Number(discountAmount);
    } else {
        discountedPrice =
            (Number(price) * discountPercent) / 100 > maximumDiscount
                ? maximumDiscount
                : (Number(price) * discountPercent) / 100;
        priceAfterDiscount = Number(price) - Number(discountedPrice);
    }

    return { priceAfterDiscount, discountedPrice };
};

const calculateCoupon = async (next, couponUsed, products, shippingFee, totalProductsPrice = 0, totalPayment = 0) => {
    let priceDiscounted = 0;
    let shippingFeeDiscounted = 0;

    const coupon = await Coupon.findOne({ couponCode: couponUsed });

    if (!coupon || coupon.quantity <= 0 || !coupon.isActive) {
        return next(new AppError('This coupon is not exist', 400));
    }

    const timeRequest = dayjs();
    if (timeRequest < dayjs(coupon.startDate) || timeRequest > dayjs(coupon.endDate)) {
        return next(new AppError('This coupon is expired', 400));
    }

    if (coupon.conditions.productsForUse.length > 0) {
        const isAllProductAcceptable = products.every((product) =>
            coupon.conditions.productsForUse.includes(product.product_id),
        );
        if (!isAllProductAcceptable) {
            return next(new AppError('This coupon is only applied to certain products', 400));
        }
    }

    if (
        totalProductsPrice < coupon.conditions.minTotalPricePayment ||
        totalProductsPrice > coupon.conditions.maxTotalPricePayment
    ) {
        return next(new AppError('This coupon is only applied to orders of a certain value', 400));
    }

    if (coupon.effects.applyTo === 'order') {
        const { priceAfterDiscount, discountedPrice } = applyDiscountEffect(coupon.effects, totalProductsPrice);
        priceDiscounted = discountedPrice;
        totalPayment = +priceAfterDiscount + +shippingFee;
    } else {
        const { priceAfterDiscount, discountedPrice } = applyDiscountEffect(coupon.effects, shippingFee);
        shippingFeeDiscounted = discountedPrice;
        totalPayment = +totalProductsPrice + +priceAfterDiscount;
    }

    return {
        totalProductsPrice,
        totalPayment,
        shippingFee,
        priceDiscounted,
        shippingFeeDiscounted,
    };
};

const checkingAndCalculatePrice = async (next, products, shippingMethod, couponUsed = null) => {
    let totalPayment = 0;
    let totalProductsPrice = 0;
    let priceDiscounted = 0;
    let shippingFeeDiscounted = 0;
    let shippingFee;
    if (shippingMethod.type === shippingType.FreeShipping) {
        shippingFee = 0;
    } else {
        shippingFee = shippingMethods.find((item) => item.country === shippingMethod.country).shippingFee;
    }

    const listCheckingProductAsync = products.map((product) => {
        return new Promise(async (resolve, reject) => {
            try {
                const price = await checkingAvailableProduct(product);
                resolve(price);
            } catch (err) {
                reject(err);
            }
        });
    });

    try {
        totalProductsPrice = (await Promise.all(listCheckingProductAsync)).reduce((total, item) => total + item, 0);
    } catch (err) {
        return next(new AppError(err, 400));
    }

    // Calculate Shipping method
    if (shippingMethod.type === shippingType.Secured) {
        shippingFee = shippingMethods.find((item) => item.country === shippingMethod.country).shippingFee + 6;
    } else if (shippingMethod.type === shippingType.FreeShipping && totalProductsPrice >= 100) {
        shippingFee = 0;
    }

    // Calculate Coupon
    if (couponUsed) {
        try {
            const {
                totalPayment: totalPaymentAfterDiscount,
                priceDiscounted: calculatedPriceDiscounted,
                shippingFeeDiscounted: calculatedShippingFeeDiscounted,
            } = await calculateCoupon(next, couponUsed, products, shippingFee, totalProductsPrice, totalPayment);

            priceDiscounted = calculatedPriceDiscounted;
            shippingFeeDiscounted = calculatedShippingFeeDiscounted;
            totalPayment = totalPaymentAfterDiscount;
        } catch {
            return;
        }
    } else {
        totalPayment = +totalProductsPrice + +shippingFee;
    }

    return {
        totalPayment,
        totalProductsPrice,
        priceDiscounted,
        shippingFeeDiscounted,
        shippingFee,
    };
};

exports.verifyCoupon = catchAsync(async (req, res, next) => {
    const { products, couponUsed, shippingMethod } = req.body;

    const { totalPayment, totalProductsPrice, priceDiscounted, shippingFeeDiscounted, shippingFee } =
        await checkingAndCalculatePrice(next, products, shippingMethod, couponUsed);

    // Prevent send response one more when checkingAndCalculatePrice function throw error
    if (!totalPayment || !totalProductsPrice) return;

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: {
            totalProductsPrice,
            shippingFee,
            priceDiscounted,
            shippingFeeDiscounted,
            totalPayment,
        },
    });
});

exports.createOrderRequest = catchAsync(async (req, res, next) => {
    const { shippingInfo, products, shippingMethod, couponUsed } = req.body;

    if (!products.length || !products) {
        return next(new AppError('Cart not be empty', 400));
    }

    const { totalPayment, totalProductsPrice, priceDiscounted, shippingFeeDiscounted, shippingFee } =
        await checkingAndCalculatePrice(next, products, shippingMethod, couponUsed);
    if (!totalPayment || !totalProductsPrice) return;

    const orderRequest = await createOrder(
        products,
        {
            totalPayment,
            totalProductsPrice,
            priceDiscounted,
            shippingFeeDiscounted,
            shippingFee,
        },
        shippingInfo,
    );
    return res.json(orderRequest);
});

exports.captureOrder = catchAsync(async (req, res, next) => {
    const { orderID } = req.params;
    const { shippingInfo, products, shippingMethod, couponUsed } = req.body;

    const { totalPayment, totalProductsPrice, priceDiscounted, shippingFeeDiscounted, shippingFee } =
        await checkingAndCalculatePrice(next, products, shippingMethod, couponUsed);
    if (!totalPayment || !totalProductsPrice) return;

    const captureData = await capturePayment(orderID);
    if (captureData?.status && captureData.status === 'COMPLETED') {
        const { address_line_1, address_line_2, admin_area_1, admin_area_2, postal_code, country_code } =
            captureData.purchase_units[0].shipping.address;

        const payload = {
            paymentId: orderID,
            paymentMethod: EnumPaymentMethod.Paypal,
            shippingMethod: shippingMethod.type || 'standard',
            products,
            couponUsed,
            logisticInfo: {
                fullName: captureData.purchase_units[0]?.shipping?.name?.full_name || shippingInfo.full_name,
                country: country_code || shippingInfo?.country,
                city: admin_area_2 || shippingInfo?.admin_area_2,
                state: admin_area_1 || shippingInfo?.admin_area_1,
                postalCode: postal_code || shippingInfo?.postal_code,
                address: address_line_1 || shippingInfo?.address_line_1,
                department: address_line_2 || shippingInfo?.address_line_2,
                mobileNumber: shippingInfo?.phoneNumber || captureData?.payer.phone.phone_number.national_number,
                email: shippingInfo?.email || captureData?.payer.email_address,
            },
            paymentInfo: {
                totalPayment,
                totalProductsPrice,
                priceDiscounted,
                shippingFeeDiscounted,
                shippingFee,
            },
        };

        const orderPlaced = await Order.create(payload);
        if (couponUsed) {
            await Coupon.findOneAndUpdate(
                { couponCode: couponUsed, quantity: { $gt: 0 } },
                {
                    $inc: { quantity: -1 },
                },
            );
        }
        return sendResponseToClient(res, 200, {
            status: 'success',
            data: orderPlaced,
        });
    }

    return next(
        new AppError(
            captureData?.details?.[0]?.description || 'An error occurred during payment with Paypal, please try again',
            400,
        ),
    );
});

exports.sendOrderConfirmationMail = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;

    const order = await Order.findByIdAndUpdate(
        orderId,
        {
            status: 'confirmed',
        },
        {
            new: true,
            runValidators: true,
        },
    ).lean();
    if (!order) {
        return next(new AppError('This order is not exist', 400));
    }
    await sendOrderConfirmation({
        to: order.logisticInfo.email,
        subject: '4DEAREST - ORDER CONFIRMATION',
        ...order,
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Sent order confirmation mail',
    });
});
exports.sendOrderShippedMail = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;
    const { trackingInfo } = req.body;

    const order = await Order.findOne({ _id: orderId, $or: [{ status: 'pending' }, { status: 'fulfilled' }] }).lean();
    if (!order) {
        return next(new AppError('This order is not exist or not confirmed yet', 400));
    }
    if (!trackingInfo && !order.trackingInfo) {
        return next(new AppError('This order is not trackingInfo yet', 400));
    }

    const editedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
            status: 'fulfilled',
            trackingInfo,
        },
        {
            new: true,
            runValidators: true,
        },
    ).lean();
    await sendShippedConfirmation({
        to: editedOrder.logisticInfo.email,
        subject: '4DEAREST - YOU ORDER WAS SHIPPED',
        ...editedOrder,
    });
    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Sent order shipped mail',
    });
});

exports.changeOrder = catchAsync(async (req, res, next) => {
    const { trackingInfo, isFulfilled } = req.body;

    const editedOrder = await Order.findByIdAndUpdate(
        req.params.orderID,
        {
            trackingInfo,
            isFulfilled,
        },
        {
            new: true,
            runValidators: true,
        },
    );
    if (!editedOrder) {
        return next(new AppError('This order is not exist', 400));
    }

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: editedOrder,
    });
});

exports.getAllOrder = catchAsync(async (req, res, next) => {
    const order = await Order.find({});
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: order,
    });
});
exports.getOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findOne({ _id: req.params.orderID });
    if (!order) {
        return next(new AppError('The order is not exist'));
    }

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: order,
    });
});
