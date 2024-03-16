exports.shippingType = {
    Standard: 'standard',
    Secured: 'secured',
    FreeShipping: 'freeShipping',
};

exports.shippingMethods = [
    {
        country: 'US',
        shippingFee: 3.59,
        estimateTime: [5, 15],
    },
    {
        country: 'GB',
        shippingFee: 3.59,
        estimateTime: [7, 20],
    },
    {
        country: 'CA',
        shippingFee: 3.59,
        estimateTime: [5, 15],
    },
    {
        country: 'AU',
        shippingFee: 3.59,
        estimateTime: [5, 16],
    },
    {
        country: 'SG',
        shippingFee: 3.59,
        estimateTime: [5, 16],
    },
    {
        country: 'NZ',
        shippingFee: 3,
        estimateTime: [10, 20],
    },
    {
        country: 'IT',
        shippingFee: 3,
        estimateTime: [10, 20],
    },
    {
        country: 'ES',
        shippingFee: 3,
        estimateTime: [10, 20],
    },
];

exports.EnumPaymentMethod = {
    Paypal: 'Paypal',
};
