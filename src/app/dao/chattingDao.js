const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 해당 챌린지 채팅 생성
 */
// 참가한 챌린지가 맞는지 체크
exports.checkChallengeChat = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select userId from UserChallenge 
        where userId = ? and challengeId = ? and isDeleted = 'N') as exist;
        `;
        const params = [userId, challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkChallengeChat DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.postChatting = async function (challengeId, userId, message, image) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into Chatting (challengeId, userId, message, image)
        values (?, ?, ?, ?);
        `;
        const params = [challengeId, userId, message, image];
        const [rows] = await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - postChatting DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}


