const express = require('express');
const router = express.Router();

const filesMiddleware = require('../middleware/filesMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const productController = require('../controller/productController');

router.post(
    '/comment/:idProduct',
    filesMiddleware.uploadMultiplePhoto('commentImages', 4),
    filesMiddleware.resizePhoto('comments'),
    productController.commentProduct,
);
router.patch(
    '/:idProduct',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('manage', 'admin'),
    filesMiddleware.uploadMultipleFields([
        { name: 'imagesProduct', maxCount: 15 },
        { name: 'imageChart', maxCount: 1 },
    ]),
    filesMiddleware.resizePhoto('products'),
    productController.changeProduct,
);
router.get('/:slug', productController.getProduct);
router.post(
    '/',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin', 'manage'),
    filesMiddleware.uploadMultipleFields([
        { name: 'imagesProduct', maxCount: 15 },
        { name: 'imageChart', maxCount: 1 },
    ]),
    filesMiddleware.resizePhoto('products'),
    productController.addProduct,
);
router.get('/', productController.getAllProduct);

module.exports = router;
