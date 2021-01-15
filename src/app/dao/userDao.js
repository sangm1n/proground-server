const { response } = require("express");
const { pool } = require("../../../config/database");

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

// 레벨 부여되도록 트랜잭션 처리 필요
exports.postUserInfo = async function (name, email, password, nickname, height, weight, gender) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        try {
            console.log(typeof(gender));
            const query = `
            insert into User (userName, email, password, nickname, height, weight, gender) values (?, ?, ?, ?, ?, ?, ?);
            `
            const params = [name, email, password, nickname, height, weight, gender];
            const [rows] = await connection.query(
                query, params
            );
            connection.release();
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - postUserInfo Transaction error\n: ${err.message}`);
            return res.status(500).send(`Error: ${err.message}`);
        }
    } catch (err) {
        logger.error(`App - postUserInfo DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}
