const authRoute = require('./authRoute');
const productRoute = require('./productRoute');
const categoryRoute = require('./categoryRoute');
const orderRoute = require('./orderRoute');
const couponRoute = require('./couponRoute');
const cartRoute = require('./cartRoute');
const utilsRoute = require('./utilsRoute');
const aliexpressServiceRoute = require('./aliexpressServiceRoute');

const route = (app) => {
    app.use('/auth', authRoute);
    app.use('/category', categoryRoute);
    app.use('/cart', cartRoute);
    app.use('/product', productRoute);
    app.use('/order', orderRoute);
    app.use('/coupon', couponRoute);
    app.use('/utils', utilsRoute);
    app.use('/aliexpress', aliexpressServiceRoute);
};

module.exports = route;
