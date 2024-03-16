const catchAsync = require('../utils/catchAsync');
const { sendResponseToClient } = require('../utils/utils');

const Product = require('../model/productModel');

exports.getCartInformation = catchAsync(async (req, res, next) => {
    const listProduct = req.body;
    // Lean func to transfer document array => js array
    const products = await Product.find({ _id: { $in: listProduct?.map((item) => item?._id) } })
        .select('id imagesProduct slug title subTitle variants')
        .lean();

    const result = listProduct.map((productClient) => {
        const productServer = products.find((product) => product._id.toString() === productClient._id.toString());

        const variantsAvailable = productServer.variants.reduce((total, variantServer) => {
            if (variantServer?.inventory <= 0) {
                return [...total];
            }

            const variantClient = productClient.variants.find(
                (variantClient) => variantClient.sku === variantServer.sku,
            );
            if (!variantClient) {
                return [...total];
            }
            return [
                ...total,
                {
                    ...variantServer,
                    buyAmount:
                        variantClient?.amount > variantServer?.inventory
                            ? variantServer?.inventory
                            : variantClient?.amount,
                },
            ];
        }, []);

        productServer.variants = variantsAvailable;
        return productServer;
    });
    const finalResult = result.filter((item) => item.variants.length >= 1);

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: finalResult,
    });
});
