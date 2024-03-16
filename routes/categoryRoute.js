const express = require('express');
const router = express.Router();

const filesMiddleware = require('../middleware/filesMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const categoryController = require('../controller/categoryController');

router.post(
    '/',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin'),
    filesMiddleware.uploadSinglePhoto('categoryImage'),
    filesMiddleware.resizePhoto('category'),
    categoryController.addCategory,
);
router.get('/', categoryController.getAllCategory);

module.exports = router;
