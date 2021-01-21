const { response } = require("express");
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
        return res.status(500).send(`Error: ${err.message}`);
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
        return res.status(500).send(`Error: ${err.message}`);
    }
}

// 사용자 정보 입력
exports.postUserInfo = async function (name, email, password) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into User (userName, email, password, loginStatus) values (?, ?, ?, "G");
        `
        const params = [name, email, password];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - postUserInfo DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
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
        return res.status(500).send(`Error: ${err.message}`);
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
        return res.status(500).send(`Error: ${err.message}`);
    }
}
