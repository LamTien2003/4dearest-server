exports.shippingType = {
    Standard: 'standard',
    Secured: 'secured',
    FreeShipping: 'freeShipping',
};

exports.shippingMethods = [
    {
        country: 'US',
        shippingFee: 3.59,
        estimateTime: [5, 7],
    },
    {
        country: 'GB',
        shippingFee: 3.59,
        estimateTime: [7, 15],
    },
    {
        country: 'CA',
        shippingFee: 3.59,
        estimateTime: [5, 7],
    },
    {
        country: 'AU',
        shippingFee: 3.59,
        estimateTime: [5, 10],
    },
    {
        country: 'SG',
        shippingFee: 3.59,
        estimateTime: [5, 10],
    },
    {
        country: 'NZ',
        shippingFee: 3,
        estimateTime: [10, 15],
    },
    {
        country: 'IT',
        shippingFee: 3,
        estimateTime: [10, 15],
    },
    {
        country: 'ES',
        shippingFee: 3,
        estimateTime: [10, 15],
    },
];

exports.EnumPaymentMethod = {
    Paypal: 'Paypal',
};
