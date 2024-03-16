const catchAsync = require('../utils/catchAsync');
const { shippingType, shippingMethods } = require('../constants');
const { sendResponseToClient } = require('../utils/utils');
const dayjs = require('dayjs');
const AppError = require('../utils/appError');

exports.getShippingMethod = catchAsync(async (req, res, next) => {
    const { country } = req.params;

    const method = shippingMethods.find((item) => item.country === country);

    if (!method) {
        return next(new AppError('Your country is not supported for shipping', 400));
    }

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: [
            {
                shippingType: shippingType.Standard,
                shippingFee: method.shippingFee,
                estimateStartDay: dayjs().add(method.estimateTime[0], 'day').format('DD-MMM').toString(),
                estimateEndDay: dayjs().add(method.estimateTime[1], 'day').format('DD-MMM').toString(),
            },
            {
                shippingType: shippingType.Secured,
                shippingFee: method.shippingFee + 6,
                estimateStartDay: dayjs().add(method.estimateTime[0], 'day').format('DD-MMM').toString(),
                estimateEndDay: dayjs().add(method.estimateTime[1], 'day').format('DD-MMM').toString(),
            },
        ],
    });
});
