const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const regexPassword = /^(?=.*[a-zA-z])(?=.*[0-9])(?=.*[!@#$%^*+=-]).{8,}$/;
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const userDao = require('../dao/userDao');
const { constants } = require('buffer');

const response = require('../../utils/response');
const passport = require('passport')
const KakaoStrategy = require('passport-kakao').Strategy
const axios = require('axios');


/***
 * update : 2021-01-26
 * 회원가입 API
 */
exports.signUp = async function (req, res) {
    const { 
        name, email, password, nickname, height, weight, gender, loginStatus
    } = req.body;
    let status;

    if (!name) return res.json(response.successFalse(2010, "이름을 입력해주세요."));
    if (!email) return res.json(response.successFalse(2020, "이메일을 입력해주세요."));
    if (!regexEmail.test(email)) return res.json(response.successFalse(2021, "이메일 형식을 확인해주세요."));
    if (!password && !loginStatus) return res.json(response.successFalse(2030, "비밀번호를 입력해주세요."));
    if (!regexPassword.test(password) && !loginStatus) return res.json(response.successFalse(2031, "비밀번호 형식을 확인해주세요."));
    if (!nickname) return res.json(response.successFalse(2040, "닉네임을 입력해주세요."));
    if (nickname.length > 7) return res.json(response.successFalse(2041, "닉네임은 7자 미만으로 입력해주세요."));
    if (!height) return res.json(response.successFalse(2042, "키를 입력해주세요."));
    if (!weight) return res.json(response.successFalse(2043, "몸무게를 입력해주세요."));
    if (!gender) return res.json(response.successFalse(2044, "성별을 입력해주세요."));
    if (!loginStatus) status = 'G' 
    else status = loginStatus;

    try {
        const emailRows = await userDao.checkUserEmail(email);
        const nicknameRows = await userDao.checkUserNickname(nickname);

        if (emailRows === 1) return res.json(response.successFalse(3018, "이미 존재하는 이메일입니다."));
        if (nicknameRows === 1) return res.json(response.successFalse(3017, "이미 존재하는 닉네임입니다."));

        if (status == 'S') {
            await userDao.postUserInfo(name, email, '', nickname, height, weight, gender, status);
        } else if (status == 'G') {
            const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
            await userDao.postUserInfo(name, email, hashedPassword, nickname, height, weight, gender, status);
        }

        return res.json(response.successTrue(1012, "회원가입에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - signUp Query error\n: ${err.message}`);
        return res.json(responsce.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-25
 * 이메일 검증 API (회원가입 되어 있는 이메일인지 아닌지)
 */
exports.checkEmail = async function (req, res) {
    const { 
        email
    } = req.body;

    try {
        const emailRows = await userDao.checkUserEmail(email);
        if (emailRows === 1) return res.json(response.successTrue(1009, "이미 가입된 이메일입니다.", {status: false}));
        else return res.json(response.successTrue(1008, "회원가입 가능한 이메일입니다.", {status: true}));
    } catch (err) {
        logger.error(`App - checkEmail Query error\n: ${err.message}`);
        return res.json(responsce.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-17
 * 회원가입 (추가 정보) API -> 삭제 예정
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
        return res.json(responsce.successFalse(4000, "서버와의 통신에 실패하였습니다."));
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
        return res.json(responsce.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-15
 * JWT 검증 API
 */
exports.check = async function (req, res) {
    res.json({
        result: req.verifiedToken,
        isSuccess: true,
        code: 200,
        message: "검증 성공"
    })
};

/***
 * update : 2021-01-27
 * 카카오 로그인 API
 */
exports.logInKakao = async function (req, res) {
    const {
        accessToken
    } = req.body;

    try {
        let kakao_profile;
        try {
            kakao_profile = await axios.get('https://kapi.kakao.com/v2/user/me', {
                headers: {
                    Authorization: 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                }
            });
        } catch (err) {
            logger.error(`Can't get kakao profile\n: ${JSON.stringify(err)}`);
            return res.json(response.successFalse(2000, "유효하지 않은 엑세스 토큰입니다."));;
        }
        
        const data = kakao_profile.data.kakao_account;

        const name = data.profile.nickname;
        const email = data.email;

        const emailRows = await userDao.checkUserEmail(email);
        // 이미 존재하는 이메일인 경우 = 회원가입 되어 있는 경우 -> 로그인 처리
        if (emailRows === 1) {
            const userInfoRows = await userDao.getUserInfo(email);

            const token = await jwt.sign({
                userId: userInfoRows.userId
            },
            secret_config.jwtsecret,
            {
                expiresIn: '365d',
                subject: 'userId'
            });
    
            const result = { jwt: token };
            return res.json(response.successTrue(1013, "소셜 로그인에 성공하였습니다.", result));
        // 그렇지 않은 경우 -> 회원가입 처리
        } else {
            const result = {
                name: name,
                email: email,
                loginStatus: 'S'
            };
            return res.json(response.successTrue(1011, "회원가입 가능합니다.", result));
        }
    } catch (err) {
        logger.error(`App - logInKakao Query error\n: ${JSON.stringify(err)}`);
        return res.json(responsce.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

// 테스트용
passport.use('kakao-login', new KakaoStrategy({
    clientID: '091e3895665e66cd5caa8bd6aa8c28c5',
    clientSecret: '',
    callbackURL: '/auth/kakao/callback',
}, (accessToken, refreshToken, profile, done) => {
    console.log(accessToken);
    console.log(profile);
}));

