const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const couponController = require('../controller/couponController');
const orderController = require('../controller/orderController');

router.post('/verify', orderController.verifyCoupon);
router.post('/', authMiddleware.protectLogin, authMiddleware.restrictTo('admin'), couponController.createCoupon);
router.get('/', couponController.getCouponsAvailable);

module.exports = router;
