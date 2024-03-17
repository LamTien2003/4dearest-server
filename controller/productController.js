const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const { sendResponseToClient } = require('../utils/utils');

const Product = require('../model/productModel');
const Review = require('../model/reviewModel');
const Category = require('../model/categoryModel');

exports.addProduct = catchAsync(async (req, res, next) => {
    const { category, title, subTitle, description, additionalInfo, variants, tags } = req.body;
    const payload = { category, title, subTitle, description, additionalInfo, variants, tags };

    if (req?.files?.filename) {
        payload.imagesProduct = req.files.filename;
    }

    const newProduct = await Product.create(payload);
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: newProduct,
    });
});

exports.changeProduct = catchAsync(async (req, res, next) => {
    const { title, subTitle, description, additionalInfo, variants, tags, imagesProduct, isPublic } = req.body;

    const editedProduct = await Product.findByIdAndUpdate(
        req.params.idProduct,
        {
            title,
            subTitle,
            description,
            additionalInfo,
            variants,
            tags,
            isPublic,
            imagesProduct: req?.files?.filename ? req.files.filename : imagesProduct,
        },
        {
            new: true,
            runValidators: true,
        },
    );

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: editedProduct,
    });
});

exports.getAllProduct = catchAsync(async (req, res, next) => {
    const { category } = req.query;
    const productPipeline = [
        {
            $match: { isPublic: true },
        },
        {
            $set: {
                price: {
                    $getField: {
                        field: 'discountPrice',
                        input: { $first: '$variants' },
                    },
                },
            },
        },
        {
            $set: {
                sold: {
                    $sum: '$variants.soldItems',
                },
            },
        },
    ];
    const listCategoryToFind = await Category.find({
        $or: [{ slug: { $in: category } }, { parent: { $in: category } }],
    })
        .select('slug')
        .lean();
    const productsQuery = new APIFeatures(Product.aggregate(productPipeline), req.query)
        .filter()
        .sort()
        .search('title')
        .searchCategory(listCategoryToFind)
        .paginate();

    const products = await productsQuery.query;

    const totalItems = await new APIFeatures(Product.aggregate(productPipeline), req.query)
        .filter()
        .sort()
        .search('title')
        .searchCategory(listCategoryToFind)
        .query.count('totalItems');

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: products,
        ...totalItems[0],
    });
});

exports.commentProduct = catchAsync(async (req, res, next) => {
    const { comment, rateStar, customerName } = req.body;
    const payload = { comment, rateStar, customerName, product: req.params.idProduct };

    if (req?.files?.filename) {
        payload.commentImages = req.files.filename;
    }

    await Review.create(payload);
    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Comment successfully',
    });
});

exports.getProduct = catchAsync(async (req, res, next) => {
    const { slug } = req.params;

    const product = await Product.findOne({ slug, isPublic: true }).populate(['category', 'reviews']);
    if (!product) {
        return next(new AppError('This product is not exist', 400));
    }

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: product,
    });
});
