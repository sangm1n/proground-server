const admin = require('firebase-admin');

const pushModule = async function (title, body, token) {
    let message = {
        data: {
            title: title,
            body: body
        },
        token: token
    };

    console.log(`${token}에 "${title}" 푸시 성공`)

    admin
        .messaging()
        .send(message)
        .then(function (response) {
            console.log('성공 ! ', response);
        })
        .catch(function (err) {
            console.log(err);
        });
};

module.exports = pushModule;
