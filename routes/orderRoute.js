const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const orderController = require('../controller/orderController');

router.post(
    '/sendOrderConfirmation/:orderId',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin', 'manage'),
    orderController.sendOrderConfirmationMail,
);
router.post(
    '/sendOrderShipped/:orderId',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin', 'manage'),
    orderController.sendOrderShippedMail,
);
router.post('/capture/:orderID', orderController.captureOrder);
router.post('/request', orderController.createOrderRequest);
router.patch(
    '/:orderID',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin', 'manage'),
    orderController.changeOrder,
);
router.get(
    '/:orderID',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin', 'manage'),
    orderController.getOrder,
);
router.get('/', authMiddleware.protectLogin, authMiddleware.restrictTo('admin', 'manage'), orderController.getAllOrder);

module.exports = router;
