exports.generateAccessToken = async () => {
    try {
        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString(
            'base64',
        );
        const response = await fetch(`${process.env.PAYPAL_ENDPOINT}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Bearer ${auth}`,
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Failed to generate Access Token:', error);
    }
};
