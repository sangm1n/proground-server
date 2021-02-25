const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 리더 권한 부여
 */
exports.updateUserType = async function (profileImage, nickname) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update User set userType = 'L', profileImage = ? where nickname = ?;
        `;
        const params = [profileImage, nickname];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - updateUserType DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.checkAdmin = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists (select userId from User where userId = ? and userType = 'A' and isDeleted = 'N') as exist;
        `;
        const params = [userId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkAdmin DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 챌린지 생성
 */
exports.insertChallenge = async function (challengeName, introduction, image, challengeType, distance, personnel, minLevel, maxLevel, startDate, endDate, firstColor, firstTeamName, secondColor, secondTeamName) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into Challenge (challengeName, introduction, image, challengeType, distance, personnel, minLevel, maxLevel, startDate, endDate, firstColor, firstTeamName, secondColor, secondTeamName) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const params = [challengeName, introduction, image, challengeType, distance, personnel, minLevel, maxLevel, startDate, endDate, firstColor, firstTeamName, secondColor, secondTeamName];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - insertChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
