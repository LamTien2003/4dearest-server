const catchAsync = require('../utils/catchAsync');
const { signApiRequest } = require('../utils/utils');

exports.getShippingInformation = catchAsync(async (req, res, next) => {
    const API_NAME = 'aliexpress.ds.freight.query';
    const TIMESTAMP = Date.now();
    const BASE_URL = `${process.env.ALIEXPRESS_BUSINESS_API_ENDPOINT}?method=${API_NAME}&app_key=${process.env.ALIEXPRESS_APP_KEY}&sign_method=sha256&timestamp=${TIMESTAMP}&sign=`;

    const params = {
        method: API_NAME,
        timestamp: TIMESTAMP,
        sign_method: 'sha256',
        app_key: process.env.ALIEXPRESS_APP_KEY,
        quantity: 1,
        shipToCountry: 'FR',
        loginId: 'kr1040495815atrae',
        productId: '3256802900954148',
        provinceCode: '',
        cityCode: '',
        language: 'en_US',
        source: 'CN',
        locale: 'en_US',
        userId: 0,
        requestId: '',
        selectedSkuId: '12000023999200390',
        currency: 'USD',
        class: 'com.aidc.supersupplier.model.OutProductRequest',
    };

    const FinalURL = BASE_URL + signApiRequest(params, API_NAME);

    res.json(FinalURL);
});
