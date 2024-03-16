const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const { sendResponseToClient } = require('../utils/utils');

const Category = require('../model/categoryModel');

exports.addCategory = catchAsync(async (req, res, next) => {
    const { categoryName, href } = req.body;
    const payload = { categoryName, href };

    if (req?.file?.filename) {
        payload.categoryImage = req.file.filename;
    }

    const newCategory = await Category.create(payload);
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: newCategory,
    });
});

exports.getAllCategory = catchAsync(async (req, res, next) => {
    const categoryQuery = new APIFeatures(Category.find({}), req.query).filter().search('categoryName').paginate();
    const categories = await categoryQuery.query.populate('amountProducts');
    const totalItems = await Category.find().merge(categoryQuery.query).skip(0).limit(0).count();

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: categories,
        totalItems,
    });
});
