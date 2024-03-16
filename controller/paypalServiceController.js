const generateAccessToken = async () => {
    try {
        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString(
            'base64',
        );
        const response = await fetch(`${process.env.PAYPAL_ENDPOINT}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Failed to generate Access Token:', error);
    }
};

exports.capturePayment = async (orderId) => {
    const accessToken = await generateAccessToken();
    const url = `${process.env.PAYPAL_ENDPOINT}/v2/checkout/orders/${orderId}/capture`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await response.json();
    return data;
};

exports.createOrder = async (cart, paymentInfo, shippingInfo = null) => {
    try {
        const { totalPayment, totalProductsPrice, priceDiscounted, shippingFeeDiscounted, shippingFee } = paymentInfo;
        const accessToken = await generateAccessToken();
        const products = cart
            .map((product) => {
                return product.variants
                    .map((variant) => ({
                        name: `${product.product_name}-${variant?.color.label}`,
                        sku: variant.sku,
                        unit_amount: {
                            currency_code: 'USD',
                            value: variant.price,
                        },
                        quantity: variant.amount,
                    }))
                    .flat();
            })
            .flat();

        const dataPurchaseUnit = {
            items: products,
            amount: {
                currency_code: 'USD',
                value: totalPayment.toFixed(2),
                breakdown: {
                    item_total: {
                        currency_code: 'USD',
                        value: totalProductsPrice.toFixed(2),
                    },
                    shipping: {
                        currency_code: 'USD',
                        value: shippingFee.toFixed(2),
                    },
                    discount: {
                        currency_code: 'USD',
                        value: priceDiscounted.toFixed(2),
                    },
                    shipping_discount: {
                        currency_code: 'USD',
                        value: shippingFeeDiscounted.toFixed(2),
                    },
                },
            },
        };
        if (shippingInfo) {
            dataPurchaseUnit.shipping = {
                type: 'SHIPPING',
                name: {
                    full_name: shippingInfo.full_name,
                },
                address: {
                    address_line_1: shippingInfo.address_line_1,
                    address_line_2: shippingInfo.address_line_2,
                    admin_area_1: shippingInfo.admin_area_1,
                    admin_area_2: shippingInfo.admin_area_2,
                    postal_code: shippingInfo.postal_code,
                    country_code: shippingInfo.country,
                },
            };
        }
        const response = await fetch(`${process.env.PAYPAL_ENDPOINT}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [dataPurchaseUnit],
                application_context: {
                    shipping_preference: shippingInfo ? 'SET_PROVIDED_ADDRESS' : 'GET_FROM_FILE',
                },
            }),
        });

        const data = await response.json();
        return data;
    } catch (err) {
        throw err;
    }
};
