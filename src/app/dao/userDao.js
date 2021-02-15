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
exports.postUserInfo = async function (name, email, password, nickname, height, weight, gender, loginStatus) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into User (userName, email, password, nickname, height, weight, gender, loginStatus) values (?, ?, ?, ?, ?, ?, ?, ?);
        `
        const params = [name, email, password, nickname, height, weight, gender, loginStatus];
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

// 카카오 회원가입 및 로그인
exports.postUserInfoKakao = async function (name, email, nickname, height, weight, gender, profile_image) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into User (userName, email, nickname, height, weight, gender, profileImage, loginStatus) values (?, ?, ?, ?, ?, ?, ?, "S");
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
        insert into UserLevel (userId, level) values (?, 1);
        `
        const params = [userId];
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
        select userId, userName, email, password, nickname, height, weight, gender from User where email = ?;
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
        select email from User where userId = ?;
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
        select profileImage, userName, nickname, email, height, weight, gender from User where userId = ?;
        `;
        const params = [userId];
        const [rows] = await connection.query(
            query, params
        );
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
        select level, profileImage
        from UserLevel ul
                join User u on ul.userId = u.userId
        where ul.userId = ? and u.isDeleted = 'N';
        `;
        const params = [userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - patchProfileImage DB Connection error\n: ${err.message}`);
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