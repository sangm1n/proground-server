const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 회원가입
 */
// 이메일 체크
exports.checkUserEmail = async function (email) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select email from User where email = ? and isDeleted = 'N') as exist;
        `;
        const params = [email];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkUserEmail DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.checkUserId = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select userId from User where userId = ? and isDeleted = 'N') as exist;
        `;
        const params = [userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkUserId DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.checkNonUserId = async function (nonUserId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select nonUserId from NonUser where nonUserId = ? and isDeleted = 'N') as exist;
        `;
        const params = [nonUserId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkUserEmail DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 닉네임 체크
exports.checkUserNickname = async function (nickname) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select nickname from User where nickname = ? and isDeleted = 'N') as exist;
        `;
        const params = [nickname];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkUserNickname DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 사용자 정보 입력
exports.postUserInfo = async function (nonUserId, name, email, password, nickname, height, weight, gender, loginStatus, fcmToken) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into User (nonUserId, userName, email, password, nickname, height, weight, gender, loginStatus, fcmToken) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `
        const params = [nonUserId, name, email, password, nickname, height, weight, gender, loginStatus, fcmToken];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - postUserInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 사용자 추가 정보 입력
exports.postUserAddInfo = async function (nickname, height, weight, gender, userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update User set nickname = ?, height = ?, weight = ?, gender = ? where userId = ?;
        `
        const params = [nickname, height, weight, gender, userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - postUserAddInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// fcm 갱신
exports.updateUserFcm = async function (state) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update ` + state + `;
        `
        await connection.query(query);
        connection.release();
    } catch (err) {
        logger.error(`App - updateUserFcm DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.updateNonUserFcm = async function (fcmToken, nonUserId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update NonUser set fcmToken = ? where nonUserId = ?;
        `
        const params = [fcmToken, nonUserId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - updateNonUserFcm DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 카카오 회원가입 및 로그인
exports.postUserInfoKakao = async function (name, email, nickname, height, weight, gender, profile_image) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into User (userName, email, nickname, height, weight, gender, profileImage, loginStatus, fcmToken) values (?, ?, ?, ?, ?, ?, ?, "S");
        `
        const params = [name, email, nickname, height, weight, gender, profile_image];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - postUserInfoKakao DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 회원가입 시 레벨 1 부여
exports.postUserLevel = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into UserLevel (userId, level) select ?, 1 from dual
        where not exists (select userId, level from UserLevel where userId = ? and level = 1);
        `
        const params = [userId, userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - postUserLevel DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 회원가입 시 기본 프로필 이미지 부여
exports.postUserImage = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update User set profileImage = 'https://proground.s3.ap-northeast-2.amazonaws.com/profile/profile_basic_img.png' where userId = ?;
        `
        const params = [userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - postUserImage DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 로그인
 */
// 사용자 정보 얻기
exports.getUserInfo = async function (email) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select userId, userName, email, password, nickname, cast(height as double) as height, cast(weight as double) as weight, gender from User where email = ?;
        `;
        const params = [email];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getUserInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 비밀번호 찾기
 */
// 사용자 이메일 얻기
exports.getUserEmail = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select email from User where userId = ? and isDeleted = 'N';
        `;
        const params = [userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['email'];
    } catch (err) {
        logger.error(`App - getUserEmail DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 임시 비밀번호로 변경
exports.patchPassword = async function (password, email) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update User set password = ? where email = ?;
        `;
        const params = [password, email];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - patchPassword DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 프로필 관련
 */
// 프로필 조회
exports.getUserProfile = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select profileImage, userName, nickname, email, cast(height as double) as height, cast(weight as double) as weight, gender, userType, isNotified from User where userId = ?;
        `;
        const params = [userId];
        let [rows] = await connection.query(
            query, params
        );

        if (rows[0].gender === 'M') rows[0].gender = '남성';
        else rows[0].gender = '여성';

        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getUserProfile DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 프로필 정보 수정
exports.patchProfileInfo = async function (name, nickname, email, height, weight, gender, userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update User
        set userName = ?, nickname = ?, email = ?, height = ?, weight = ?, gender = ?
        where userId = ?
        `;
        const params = [name, nickname, email, height, weight, gender, userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - patchProfileInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 프로필 이미지 수정
exports.patchProfileImage = async function (profileImage, userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update User
        set profileImage = ?
        where userId = ?
        `;
        const params = [profileImage, userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - patchProfileImage DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 사용자 레벨 조회
exports.getUserLevel = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select ul.level, levelColor, profileImage
        from UserLevel ul
                join Level l on ul.level = l.level
                join User u on ul.userId = u.userId
        where ul.userId = ?
        and u.isDeleted = 'N';
        `;
        const params = [userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getUserLevel DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 1:1 문의
exports.postUserQuestion = async function (email, question) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        Insert into Question (email, question) values (?, ?);
        `;
        const params = [email, question];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - postUserQuestion DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 비회원 생성
exports.postNonUser = async function (fcmToken) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        Insert into NonUser (fcmToken) values (?);
        `;
        const params = [fcmToken];
        await connection.query(query, params);

        query = `
        select nonUserId from NonUser where isDeleted = 'N' order by createdAt desc limit 1;
        `
        const [rows] = await connection.query( query );
        connection.release();

        return rows[0]['nonUserId'];
    } catch (err) {
        logger.error(`App - postNonUser DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 회원 or 비회원 체크
exports.getUserNonUser = async function (state) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select ` + state + `;
        `;
        const [rows] = await connection.query(query);
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getUserNonUser DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.updateNonUserStatus = async function (nonUserId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update NonUser set isSignedUp = 'Y' where nonUserId = ?;
        `;
        const params = [nonUserId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - updateNonUserStatus DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 푸시 알림에서 사용자 뽑아내기
 */
exports.getAllUser = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select userId, fcmToken from User where isDeleted = 'N' and userType != 'A' and isNotified = 'Y' and isLogedIn = 'Y';
        `;
        const [rows] = await connection.query(query);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getAllUser DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getAllNonUser = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select nonUserId, fcmToken from NonUser where isSignedUp = 'N' and isDeleted = 'N' and isNotified = 'Y' and isLogedIn = 'Y';
        `;
        const [rows] = await connection.query(query);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getAllNonUser DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getAllPushUser = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select fcmToken
        from User
        where isDeleted = 'N'
        and userType != 'A'
        and isNotified = 'Y'
        and isLogedIn = 'Y'
        union
        distinct
        select fcmToken
        from NonUser
        where isSignedUp = 'N'
        and isDeleted = 'N'
        and isNotified = 'Y';
        `;
        const [rows] = await connection.query(query);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getAllPushUser DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getAllUserChallenge = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select distinct u.userId, nickname, fcmToken, isNotified, isLogedIn
        from User u
                join UserChallenge uc on u.userId = uc.userId
        where u.isDeleted = 'N'
        and uc.isDeleted = 'N'
        and uc.challengeId = ?
        and u.userType = 'G';
        `;
        const params = [challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getAllUserChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getAllUserLevel = async function (level) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select distinct u.userId, nickname, fcmToken, isNotified, isLogedIn
        from User u
                join UserLevel ul on u.userId = ul.userId
        where u.isDeleted = 'N'
        and ul.level = ?
        and u.userType = 'G';
        `;
        const params = [level];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getAllUserLevel DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getUserFcmToken = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select userId, nickname, fcmToken, isNotified, isLogedIn
        from User where userId = ? and isDeleted = 'N' and userType = 'G';
        `;
        const params = [userId];
        const [rows] = await connection.query(query, params);
        connection.release();
        
        return rows[0];
    } catch (err) {
        logger.error(`App - getUserFcmToken DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.countAllNotice = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select count(noticeId) as countNotice from Notice where isDeleted = 'N';
        `;
        const [rows] = await connection.query(query);
        connection.release();
        
        return rows[0]['countNotice'];
    } catch (err) {
        logger.error(`App - countAllNotice DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 읽은 공지 개수
exports.countReadNotice = async function (userId, state) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select count(noticeId) as countReadNotice from UserNotice where userId = ? and isSignedUp = ?;
        `;
        const params = [userId, state];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['countReadNotice'];
    } catch (err) {
        logger.error(`App - countReadNotice DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// fcm 갱신
exports.patchUserFcm = async function (fcmToken, userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update User set fcmToken = ?, isLogedIn = 'Y' where userId = ?;
        `;
        const params = [fcmToken, userId];
        const [rows] = await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - patchUserFcm DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 알림 여부 조회
exports.getUserNotify = async function (state) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select isNotified from ` + state + `;
        `;
        const params = [state];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['isNotified'];
    } catch (err) {
        logger.error(`App - getUserNotify DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 알림 여부 갱신
exports.patchUserNotify = async function (state) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update ` + state + `;
        `;
        const params = [state];
        const [rows] = await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - patchUserNotify DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.checkLeader = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select userType from User where userId = ?;
        `;
        const params = [userId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['userType'];
    } catch (err) {
        logger.error(`App - checkLeader DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.userLogout = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update User set isLogedIn = 'N' where userId = ?;
        `;
        const params = [userId];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - userLogout DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
