const express = require('express');
const router = express.Router();

const utilsController = require('../controller/utilsController');

router.get('/get-shipping-method/:country', utilsController.getShippingMethod);

module.exports = router;
