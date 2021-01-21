const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const userDao = require('../dao/userDao');
const { constants } = require('buffer');

const response = require('../../utils/response');

/***
 * update : 2021-01-15
 * 회원가입 API
 */
exports.signUp = async function (req, res) {
    const { 
        name, email, password
    } = req.body;

    if (!name) return res.json(response.successFalse(2050, "이름을 입력해주세요."));
    if (!email) return res.json(response.successFalse(2020, "이메일을 입력해주세요."));
    if (!regexEmail.test(email)) return res.json(response.successFalse(2021, "이메일 형식을 확인해주세요."));
    if (!password) return res.json(response.successFalse(2030, "비밀번호를 입력해주세요."));

    try {
        const emailRows = await userDao.checkUserEmail(email);
        if (emailRows === 1) return res.json(response.successFalse(3018, "이미 존재하는 이메일입니다."));

        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
        await userDao.postUserInfo(name, email, hashedPassword);
        const userInfoRows = await userDao.getUserInfo(email);

        const result = { userId: userInfoRows.userId }
        return res.json(response.successTrue(1012, "회원가입에 성공하였습니다.", result));
    } catch (err) {
        logger.error(`App - signUp Query error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

/***
 * update : 2021-01-17
 * 회원가입 (추가 정보) API
 */
exports.signUpAdd = async function (req, res) {
    const {
        nickname, height, weight, gender
    } = req.body;
    const {
        userId
    } = req.params;

    if (!nickname) return res.json(response.successFalse(2040, "닉네임을 입력해주세요."));
    if (nickname.length > 7) return res.json(response.successFalse(2041, "닉네임은 7자 미만으로 입력해주세요."));
    if (!height) return res.json(response.successFalse(2042, "키를 입력해주세요."));
    if (!weight) return res.json(response.successFalse(2043, "몸무게를 입력해주세요."));
    if (!gender) return res.json(response.successFalse(2044, "성별을 입력해주세요."));

    try {
        const nicknameRows = await userDao.checkUserNickname(nickname);
        if (nicknameRows === 1) return res.json(response.successTrue(3017, "이미 존재하는 닉네임입니다."));

        await userDao.postUserAddInfo(nickname, height, weight, gender, userId);

        return res.json(response.successTrue(1012, "회원가입에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - signUpAdd Query error\n: ${err.message}`);
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

    if (!email) return res.json(response.successFalse(2020, "이메일을 입력해주세요."));
    if (!password) return res.json(response.successFalse(2030, "비밀번호를 입력해주세요."));

    try {
        const emailRows = await userDao.checkUserEmail(email);
        const userInfoRows = await userDao.getUserInfo(email);
        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

        if (emailRows === 0 || hashedPassword !== userInfoRows.password) return res.json(response.successFalse(3014, "이메일 주소 혹은 비밀번호가 일치하지 않습니다."));

        const token = await jwt.sign({
            userId: userInfoRows.userId
        },
        secret_config.jwtsecret,
        {
            expiresIn: '365d',
            subject: 'userId'
        });

        const result = { jwt: token };
        return res.json(response.successTrue(1013, "로그인에 성공하였습니다.", result));
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