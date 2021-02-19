const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 러닝 기록
 */
// 사용자 참가 챌린지
exports.getUserChallenge = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select challengeId from UserChallenge where userId = ? and isDeleted = 'N';
        `;
        const params = [userId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getUserChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 비회원 -> userId 음수로
exports.getUserId = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select distinct userId from Running where isDeleted = 'N';
        `;
        const [rows] = await connection.query(query);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getUserId DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 러닝 기록 입력
exports.postRunning = async function (challengeId, userId, nonUserId, distance, startTime, endTime, pace, altitude, calorie) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into Running (challengeId, userId, nonUserId, distance, startTime, endTime, pace, altitude, calorie)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const params = [challengeId, userId, nonUserId, distance, startTime, endTime, pace, altitude, calorie];
        const [rows] = await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - postRunning DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 오늘 달린 회원 수 조회
 */
exports.getRunningCount = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select count(runningId) as runningCount
        from Running
        where isDeleted = 'N'
        and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
        and endTime <= str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H');
        `;
        const [rows] = await connection.query(query);
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getRunningCount DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
