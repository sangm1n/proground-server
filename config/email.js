const nodemailer = require('nodemailer');
const secret_config = require('../config/secret');

const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: secret_config.ADMIN_EMAIL,
        pass: secret_config.ADMIN_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = smtpTransport;
