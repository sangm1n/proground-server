const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const userDao = require('../dao/userDao');
const { constants } = require('buffer');

const response = require('../controllers/responseController')

/***
 * update : 2021-01-15
 * 회원가입 API
 */
exports.signUp = async function (req, res) {
    const { 
        name, email, password, nickname, height, weight, gender
    } = req.body;

    if (!name) return response.status(res, "", "EMPTY_NAME");
    if (!email) return response.status(res, "", "EMPTY_EMAIL");
    if (!regexEmail.test(email)) return response.status(res, "", "INVALID_EMAIL");
    if (!password) return response.status(res, "", "EMPTY_PASSWORD");
    if (!nickname) return response.status(res, "", "EMPTY_NICKNAME");
    if (nickname.length > 7) return response.status(res, "", "INVALID_NICKNAME");
    if (!height) return response.status(res, "", "EMPTY_HEIGHT");
    if (!weight) return response.status(res, "", "EMPTY_WEIGHT");
    if (!gender) return response.status(res, "", "EMPTY_GENDER");

    try {
        const emailRows = await userDao.checkUserEmail(email);
        if (emailRows === 1) return response.status(res, "", "DUPLICATED_EMAIL");
        const nicknameRows = await userDao.checkUserNickname(nickname);
        if (nicknameRows === 1) return response.status(res, "", "DUPLICATED_NICKNAME");

        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
        await userDao.postUserInfo(name, email, hashedPassword, nickname, height, weight, gender);

        return response.status(res, "", "SUCCESS_POST_USER");
    } catch (err) {
        logger.error(`App - signUp Query error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

/***
 * update : 2021-01-16
 * 로그인 API
 */
exports.logIn = async function (req, res) {
    const {
        email, password
    } = req.body;

    if (!email) return response.status(res, "", "EMPTY_EMAIL");
    if (!password) return response.status(res, "", "EMPTY_PASSWORD");

    try {
        const emailRows = await userDao.checkUserEmail(email);
        const userInfoRows = await userDao.getUserInfo(email);
        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

        if (emailRows === 0 || hashedPassword !== userInfoRows.password) return response.status(res, "", "FAILED_TO_LOGIN");

        const token = await jwt.sign({
            userId: userInfoRows.userId
        },
        secret_config.jwtsecret,
        {
            expiresIn: '365d',
            subject: 'userId'
        });

        const result = { jwt: token };
        return response.status(res, result, "SUCCESS_LOGIN");
    } catch (err) {
        logger.error(`App - logIn Query error\n: ${JSON.stringify(err)}`);
        return false;
    }
}

/***
 * update : 2021-01-15
 * JWT 검증 API
 */
exports.check = async function (req, res) {
    res.json({
        isSuccess: true,
        code: 200,
        message: "검증 성공",
        info: req.verifiedToken
    })
};