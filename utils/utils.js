exports.sendResponseToClient = (res, statusCode, data) => {
    res.status(statusCode).json({
        status: statusCode,
        data,
    });
};

exports.signApiRequest = (params, apiName) => {
    // sort all text parameters
    params.app_key = process.env.ALIEXPRESS_APP_KEY;
    params.sign_method = 'sha256';
    const keys = Object.keys(params).sort();
    const appSecret = process.env.ALIEXPRESS_SECRET_KEY;
    // concatenate all text parameters with key and value
    let query = '';
    // append API name
    query += apiName;
    for (const key of keys) {
        const value = params[key];
        if (value !== '' && value !== null && value !== undefined) {
            query += `${key}${value}`;
        }
    }
    const crypto = require('crypto');
    // sign the whole request
    let bytes = crypto.createHmac('sha256', appSecret).update(query, 'utf8').digest();

    // finally : transfer sign result from binary to upper hex string
    return bytes.toString('hex').toUpperCase();
};
