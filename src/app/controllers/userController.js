const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const regexPassword = /^(?=.*[a-zA-z])(?=.*[0-9])(?=.*[!@#$%^*+=-]).{8,}$/;
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const userDao = require('../dao/userDao');
const { constants } = require('buffer');

const passport = require('passport')
const KakaoStrategy = require('passport-kakao').Strategy
const axios = require('axios');

const s3 = require('../../utils/awsS3');
const smtpTransport = require('../../../config/email');
const admin = require('firebase-admin');
let serAccount = require('../../../config/fcm-admin.json');


/***
 * update : 2021-01-29
 * 회원가입 API
 */
exports.signUp = async function (req, res) {
    const { 
        name, email, password, nickname, height, weight, gender, loginStatus, fcmToken, nonUserId
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
    if (!fcmToken) return res.json(response.successFalse(2045, "fcmToken을 입력해주세요."));
    if (!nonUserId) return res.json(response.successFalse(2046, "nonUserId를 입력해주세요."));
    if (!loginStatus) status = 'G' 
    else status = loginStatus;

    try {
        const emailRows = await userDao.checkUserEmail(email);
        const nicknameRows = await userDao.checkUserNickname(nickname);
        const nonUserRows = await userDao.checkNonUserId(nonUserId);

        if (emailRows === 1) return res.json(response.successFalse(3018, "이미 존재하는 이메일입니다."));
        if (nicknameRows === 1) return res.json(response.successFalse(3017, "이미 존재하는 닉네임입니다."));
        if (nonUserRows === 0) return res.json(response.successFalse(3019, "존재하지 않는 비회원 사용자입니다."));

        await userDao.updateNonUserStatus(nonUserId);
        logger.info(`비회원 ${nonUserId} 회원으로 변경 완료`);

        if (status == 'S') {
            await userDao.postUserInfo(nonUserId, name, email, '', nickname, height, weight, gender, status, fcmToken);
        } else if (status == 'G') {
            const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
            await userDao.postUserInfo(nonUserId, name, email, hashedPassword, nickname, height, weight, gender, status, fcmToken);
        }
        logger.info(`회원가입 완료`);

        const userInfoRows = await userDao.getUserInfo(email);
        const userId = userInfoRows.userId;

        const token = await jwt.sign({
            userId: userId
        },
        secret_config.jwtsecret,
        {
            expiresIn: '365d',
            subject: 'userId'
        });

        await userDao.postUserLevel(userId);
        await userDao.postUserImage(userId);
        logger.info(`기본 프로필 이미지 및 레벨 1 부여 완료`);

        const result = { jwt: token };
        return res.json(response.successTrue(1012, "회원가입에 성공하였습니다.", result));
    } catch (err) {
        logger.error(`App - signUp Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
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
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
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
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-16
 * 로그인 API
 */
exports.logIn = async function (req, res) {
    const {
        email, password, fcmToken
    } = req.body;

    if (!email) return res.json(response.successFalse(2020, "이메일을 입력해주세요."));
    if (!password) return res.json(response.successFalse(2030, "비밀번호를 입력해주세요."));
    if (!fcmToken) return res.json(response.successFalse(2040, "fcm 토큰을 입력해주세요."));

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

        await userDao.patchUserFcm(fcmToken, userInfoRows.userId);        
        logger.info(`${userInfoRows.userId}번 회원 fcmToken 갱신 완료`);

        const result = { jwt: token };
        return res.json(response.successTrue(1013, "로그인에 성공하였습니다.", result));
    } catch (err) {
        logger.error(`App - logIn Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-15
 * JWT 검증 API
 */
exports.check = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    if (token) token = jwt.verify(token, secret_config.jwtsecret);

    const {
        nonUserId
    } = req.body;

    if (token === undefined & nonUserId === undefined) return res.json(response.successTrue(1060, "처음 들어온 비회원입니다."));

    const countNotice = await userDao.countAllNotice();
    logger.info(`전체 공지사항 ${countNotice}개`);

    if (token === undefined) {
        const state = `nonUserId from NonUser where nonUserId = ${Number(nonUserId)}`;
        const result = await userDao.getUserNonUser(state);

        if (!result) return res.json(response.successFalse(2051, "비회원 자동 로그인에 실패하였습니다."));
        else {
            const countReadNotice = await userDao.countReadNotice(nonUserId, 'N');
            logger.info(`읽은 공지사항 ${countReadNotice}개`);
            return res.json(response.successTrue(1051, "비회원 자동 로그인에 성공하였습니다.", {userId: result.nonUserId, notReadNotice: countNotice-countReadNotice}));
        }
    } else {
        const state = `userId from User where userId = ${Number(token.userId)}`;
        const result = await userDao.getUserNonUser(state);

        if (!result) return res.json(response.successFalse(2050, "회원 자동 로그인에 실패하였습니다."));
        else {
            const countReadNotice = await userDao.countReadNotice(token.userId, 'Y');
            const profileRows = await userDao.getUserProfile(token.userId);

            const resultRows = {
                userId: result.userId,
                notReadNotice: countNotice - countReadNotice,
                height: profileRows.height,
                weight: profileRows.weight,
                gender: profileRows.gender,
                userType: profileRows.userType
            }
            logger.info(`읽은 공지사항 ${countReadNotice}개`);
            return res.json(response.successTrue(1050, "회원 자동 로그인에 성공하였습니다.", resultRows));
        }
    }
};

/***
 * update : 2021-01-27
 * 카카오 로그인 API
 */
exports.logInKakao = async function (req, res) {
    const {
        accessToken, fcmToken, nonUserId
    } = req.body;

    if (!fcmToken) return res.json(response.successFalse(2040, "fcm 토큰을 입력해주세요."));

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

            await userDao.patchUserFcm(fcmToken, userInfoRows.userId);        
            logger.info(`${userInfoRows.userId}번 회원 fcmToken 갱신 완료`);
    
            const result = { jwt: token };
            return res.json(response.successTrue(1013, "소셜 로그인에 성공하였습니다.", result));
        // 그렇지 않은 경우 -> 회원가입 처리
        } else {
            if (!nonUserId) return res.json(response.successFalse(2010, "비회원 Id를 입력해주세요."));

            const result = {
                name: name,
                email: email,
                loginStatus: 'S',
                nonUserId: nonUserId
            };
            return res.json(response.successTrue(1011, "회원가입 가능합니다.", result));
        }
    } catch (err) {
        logger.error(`App - logInKakao Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-31
 * 비밀번호 찾기 API
 */

function createCode(numeric, alphabet, signal) {
    var randomStr = "";

    for (var j = 0; j < 2; j++) {
        randomStr += numeric[Math.floor(Math.random()*numeric.length)];
    }
    for (var j = 0; j < 5; j++) {
        randomStr += alphabet[Math.floor(Math.random()*alphabet.length)];
    }
    for (var j = 0; j < 1; j++) {
        randomStr += signal[Math.floor(Math.random()*signal.length)];
    }

    return randomStr
}

exports.findPassword = async function (req, res) {
    const {
        email
    } = req.body;

    if (!email) return res.json(response.successFalse(3090, "이메일을 입력해주세요."));
    
    try {
        const numeric = "0,1,2,3,4,5,6,7,8,9".split(",");
        const alphabet = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(",");
        const signal = "!,@,#,$".split(",");

        const password = createCode(numeric, alphabet, signal);
        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');

        const mailOptions = {
            from: secret_config.ADMIN_EMAIL,
            to: email,
            subject: "프로그라운드 임시 비밀번호 발급",
            html: `<p>임시 비밀번호는 <b>${password}</b> 입니다.</p>`
        };
        
        await userDao.patchPassword(hashedPassword, email);

        await smtpTransport.sendMail(mailOptions, (err, respond) => {
            if (err) {
                smtpTransport.close();
                logger.error(`App - passwordSendMail Query error\n: ${JSON.stringify(err)}`);
                return res.json(response.successFalse(2030, "임시 비밀번호 발급에 실패했습니다."));
            } else {
                smtpTransport.close();
                return res.json(response.successTrue(1030, "임시 비밀번호가 성공적으로 발급되었습니다."));
            }
        });
    } catch (err) {
        logger.error(`App - findPassword Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-14
 * 비밀번호 변경 API
 */
exports.changePassword = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        password
    } = req.body;

    if (!password) return res.json(response.successFalse(2030, "비밀번호를 입력해주세요."));
    
    try {
        if (!regexPassword.test(password)) return res.json(response.successFalse(2031, "비밀번호 형식을 확인해주세요."));

        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
        await userDao.patchPassword(hashedPassword, userId);

        return res.json(response.successTrue(1031, "비밀번호를 성공적으로 변경했습니다."));
    } catch (err) {
        logger.error(`App - changePassword Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-31
 * 프로필 조회 API
 */
exports.profile = async function (req, res) {
    const userId = req.verifiedToken.userId;
    
    try {
        const profileRows = await userDao.getUserProfile(userId);

        return res.json(response.successTrue(1055, "프로필 조회에 성공하였습니다.", profileRows));
    } catch (err) {
        logger.error(`App - findPassword Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-31
 * 프로필 정보 수정 API
 */
exports.updateProfile = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        name, nickname, email, height, weight, gender
    } = req.body;

    if (!name) return res.json(response.successFalse(2010, "이름을 입력해주세요."));
    if (!email) return res.json(response.successFalse(2020, "이메일을 입력해주세요."));
    if (!regexEmail.test(email)) return res.json(response.successFalse(2021, "이메일 형식을 확인해주세요."));
    if (!nickname) return res.json(response.successFalse(2040, "닉네임을 입력해주세요."));
    if (nickname.length > 7) return res.json(response.successFalse(2041, "닉네임은 7자 미만으로 입력해주세요."));
    if (!height) return res.json(response.successFalse(2042, "키를 입력해주세요."));
    if (!weight) return res.json(response.successFalse(2043, "몸무게를 입력해주세요."));
    if (!gender) return res.json(response.successFalse(2044, "성별을 입력해주세요."));
    
    try {
        const userEmailRows = await userDao.getUserEmail(userId);
        if (userEmailRows != email) return res.json(response.successFalse(2045, "이메일은 변경할 수 없습니다."));

        await userDao.patchProfileInfo(name, nickname, email, height, weight, gender, userId);
        const profileRows = await userDao.getUserProfile(userId);

        return res.json(response.successTrue(1060, "프로필 정보 수정에 성공하였습니다.", profileRows));
    } catch (err) {
        logger.error(`App - updateProfile Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-31
 * 프로필 이미지 수정 API
 */
exports.updateProfileImage = async function (req, res) {
    const userId = req.verifiedToken.userId;

    if (!req.file) return res.json(response.successFalse(3060, "프로필 이미지를 입력해주세요."));
    
    try {        
        const profileRows = await userDao.getUserProfile(userId);
        const originProfile = profileRows.profileImage;

        const fileName = originProfile.split('/')[4];
        s3.erase('/profile', fileName);

        const newProfile = req.file.location;
        await userDao.patchProfileImage(newProfile, userId);

        return res.json(response.successTrue(1061, "프로필 이미지 수정에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - updateProfileImage Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-14
 * 사용자 레벨 조회 API
 */
exports.userLevel = async function (req, res) {
    const userId = req.verifiedToken.userId;
    
    try {
        const levelRows = await userDao.getUserLevel(userId);
        if (!levelRows.level) return res.json(response.successFalse(3050, "사용자 레벨 조회에 실패하였습니다."));

        return res.json(response.successTrue(1070, "사용자 레벨 조회에 성공하였습니다.", levelRows));
    } catch (err) {
        logger.error(`App - userLevel Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-14
 * 1:1 문의 API
 */
exports.userQuestion = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;

    const {
        question
    } = req.body;

    if (token) token = jwt.verify(token, secret_config.jwtsecret);
    if (!question) return res.json(response.successFalse(2150, "문의 사항을 입력해주세요."));
    
    try {
        if (token) {
            const userId = token.userId;
            const emailRows = await userDao.getUserEmail(userId);

            await userDao.postUserQuestion(emailRows, question);
        } else {
            await userDao.postUserQuestion(null, question);
        }
        return res.json(response.successTrue(1080, "문의 사항이 성공적으로 등록되었습니다."));
    } catch (err) {
        logger.error(`App - userQuestion Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-17
 * 비회원 생성 API
 */
exports.nonUser = async function (req, res) {    
    const {fcmToken} = req.body;
    
    if (!fcmToken) return res.json(response.successFalse(2900, "fcmToken을 입력해주세요."));

    try {
        const nonUserRows = await userDao.postNonUser(fcmToken);
        
        return res.json(response.successTrue(1900, "비회원 생성에 성공하였습니다.", nonUserRows));
    } catch (err) {
        logger.error(`App - nonUser Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * /***
 * update : 2021-03-04
 * 알림 여부 설정 API
 */
exports.setNotification = async function (req, res) {    
    let token = req.headers['x-access-token'] || req.query.token;
    const {
        isNotified, nonUserId
    } = req.body;

    if (token === undefined & !nonUserId) return res.json(response.successFalse(2000, "비회원 Id를 입력해주세요."));
    if (token) token = jwt.verify(token, secret_config.jwtsecret);
    if (!isNotified) return res.json(response.successFalse(2010, "알림 여부를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            const tmp = `NonUser set isNotified = '${isNotified}' where nonUserId = ` + nonUserId;
            await userDao.patchUserNotify(tmp);

            const state = 'NonUser where nonUserId = ' + nonUserId;
            const status = await userDao.getUserNotify(state);

            return res.json(response.successTrue(1000, "알림 여부 설정에 성공하였습니다.", {isNotified: status}));
        // 회원
        } else {
            const tmp = `User set isNotified = '${isNotified}' where userId = ` + token.userId;
            await userDao.patchUserNotify(tmp);

            const state = 'User where userId = ' + token.userId;
            const status = await userDao.getUserNotify(state);

            return res.json(response.successTrue(1000, "알림 여부 설정에 성공하였습니다.", {isNotified: status}));
        }        
    } catch (err) {
        logger.error(`App - setNotification Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

admin.initializeApp({
    credential: admin.credential.cert(serAccount)
});

/***
 * update : 2021-02-22
 * 푸쉬 알림
 */
exports.fcmPush = async function (req, res) {    
    try {
        let message = {
            data: {
                title: "테스트",
                body: "안녕하세요",
            },
            token: "cQksO2DqTJK3vTK6dI4tIb:APA91bGs8CI1TtvugLkwtfJNNHMaDxnrfipntbxwhXymNFYQ1KYsRv9TC8_YYWL9JvfLQ92ZrtYEeXVDJX8Ld5iWuRP2TfEZOQFS8TDGf165Qdn34zxVQuZmiJVZG13oX_TQyAV5WMMP"
        };

        admin
            .messaging()
            .send(message)
            .then(function (response) {
                console.log('성공 ! ', response);
            })
            .catch(function (err) {
                console.log(err);
            })
    } catch (err) {
        logger.error(`App - nonUser Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-26
 * FCM 토큰 갱신 API
 */
exports.updateFcm = async function (req, res) {    
    let token = req.headers['x-access-token'] || req.query.token;
    const {fcmToken, nonUserId} = req.body;

    if (token) token = jwt.verify(token, secret_config.jwtsecret);
    if (fcmToken === undefined) return res.json(response.successFalse(2000, "fcmToken을 입력해주세요."));
    if (token === undefined && nonUserId === undefined) return res.json(response.successFalse(2010, "회원이면 jwt를, 비회원이면 nonUserId를 입력해주세요."));
    
    try {
        if (token === undefined) {
            const state = `nonUserId from NonUser where nonUserId = ${Number(nonUserId)}`;
            const result = await userDao.getUserNonUser(state);
    
            if (!result) return res.json(response.successFalse(3010, "존재하지 않는 비회원입니다."));
            else {
                const status = `NonUser set fcmToken = '${fcmToken}' where nonUserId = ${nonUserId}`;
                await userDao.updateUserFcm(status);
            }
        } else {
            const userId = token.userId;
            const state = `userId from User where userId = ${Number(userId)}`;
            const result = await userDao.getUserNonUser(state);
    
            if (!result) return res.json(response.successFalse(3000, "존재하지 않는 회원입니다."));
            else {
                const status = `User set fcmToken = '${fcmToken}' where userId = ${userId}`;
                await userDao.updateUserFcm(status);
            }
        }
        
        return res.json(response.successTrue(1000, "fcm 토큰을 갱신하였습니다."));
    } catch (err) {
        logger.error(`App - updateFcm Query error\n: ${JSON.stringify(err)}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
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
