const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

exports.sendOrderConfirmation = async (options) => {
    let html = await fs.promises.readFile(path.join(__dirname, 'confirmOrder.html'), 'utf-8');

    const orderItems = options.products
        .map((item) =>
            item?.variants.map(
                (variant) => `
                <div style="display: flex; margin: 20px 0">
                    <div style="position: relative; margin-right: 20px">
                        <img
                            src=${variant.image}
                            alt=""
                            style="width: 84px; object-fit: cover; border-radius: 4px"
                        />
                    </div>
                    <div style="font-size: 16.5px; font-weight: 500; align-self: center">
                        <div>
                            <h5 style="color: #252526">${item.product_name}</h5>
                            <h5 style="color: #585759">${variant.color.toUpperCase()}</h5>
                        </div>
                        <p style="font-size: 12.5px; color: #585759">Amount: ${variant.amount}</p>
                        <p style="font-size: 12.5px; color: #585759">${variant.price.toFixed(2)}$</p>
                    </div>
                </div>`,
            ),
        )
        .join('');

    html = html.replaceAll('[name]', options.logisticInfo.fullName);
    html = html.replaceAll('[phoneNumber]', options.logisticInfo.mobileNumber);
    html = html.replaceAll('[address]', options.logisticInfo.address);
    html = html.replaceAll('[city]', options.logisticInfo.city);
    html = html.replaceAll('[state]', options.logisticInfo.state);
    html = html.replaceAll('[country]', options.logisticInfo.country);
    html = html.replaceAll('[shippingMethod]', options.shippingMethod.toUpperCase());
    html = html.replaceAll('[items]', orderItems);
    html = html.replaceAll('[subtotal]', options.paymentInfo.totalProductsPrice.toFixed(2));
    html = html.replaceAll('[shippingFee]', options.paymentInfo.shippingFee.toFixed(2));
    html = html.replaceAll('[priceDiscount]', options.paymentInfo.priceDiscounted.toFixed(2));
    html = html.replaceAll('[shippingDiscount]', options.paymentInfo.shippingFeeDiscounted.toFixed(2));
    html = html.replaceAll('[totalPrice]', options.paymentInfo.totalPayment.toFixed(2));

    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD,
        },
    });
    // 2) Define the email options
    const mailOptions = {
        from: {
            name: '4dearest',
            address: '4dearest.official@mgmail.com',
        },
        to: options.to,
        subject: options.subject,
        html,
    };
    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};
exports.sendShippedConfirmation = async (options) => {
    let html = await fs.promises.readFile(path.join(__dirname, 'confirmShipped.html'), 'utf-8');

    const orderItems = options.products
        .map((item) =>
            item?.variants.map(
                (variant) => `
                <div style="display: flex; margin: 20px 0">
                    <div style="position: relative; margin-right: 20px">
                        <img
                            src=${variant.image}
                            alt=""
                            style="width: 84px; object-fit: cover; border-radius: 4px"
                        />
                    </div>
                    <div style="font-size: 16.5px; font-weight: 500; align-self: center">
                        <div>
                            <h5 style="color: #252526">${item.product_name}</h5>
                            <h5 style="color: #585759">${variant.color.toUpperCase()}</h5>
                        </div>
                        <p style="font-size: 12.5px; color: #585759">Amount: ${variant.amount}</p>
                        <p style="font-size: 12.5px; color: #585759">${variant.price.toFixed(2)}$</p>
                    </div>
                </div>`,
            ),
        )
        .join('');
    html = html.replaceAll('[name]', options.logisticInfo.fullName);
    html = html.replaceAll('[phoneNumber]', options.logisticInfo.mobileNumber);
    html = html.replaceAll('[address]', options.logisticInfo.address);
    html = html.replaceAll('[city]', options.logisticInfo.city);
    html = html.replaceAll('[state]', options.logisticInfo.state);
    html = html.replaceAll('[country]', options.logisticInfo.country);
    html = html.replaceAll('[shippingMethod]', options.shippingMethod.toUpperCase());
    html = html.replaceAll('[trackingID]', options.trackingInfo.trackingID);
    html = html.replaceAll('[shippingCarrier]', options.trackingInfo.shippingCarrier);
    html = html.replaceAll('[items]', orderItems);
    html = html.replaceAll('[subtotal]', options.paymentInfo.totalProductsPrice.toFixed(2));
    html = html.replaceAll('[shippingFee]', options.paymentInfo.shippingFee.toFixed(2));
    html = html.replaceAll('[priceDiscount]', options.paymentInfo.priceDiscounted.toFixed(2));
    html = html.replaceAll('[shippingDiscount]', options.paymentInfo.shippingFeeDiscounted.toFixed(2));
    html = html.replaceAll('[totalPrice]', options.paymentInfo.totalPayment.toFixed(2));

    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD,
        },
    });
    // 2) Define the email options
    const mailOptions = {
        from: {
            name: '4dearest',
            address: '4dearest.official@mgmail.com',
        },
        to: options.to,
        subject: options.subject,
        html,
    };
    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};
