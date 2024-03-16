const express = require('express');
const router = express.Router();

const cartController = require('../controller/cartController');

router.post('/getInformation', cartController.getCartInformation);

module.exports = router;
