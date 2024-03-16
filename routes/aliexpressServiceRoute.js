const express = require('express');
const router = express.Router();

const aliexpressServiceController = require('../controller/aliexpressServiceController');

router.get('/shipping-info', aliexpressServiceController.getShippingInformation);

module.exports = router;
