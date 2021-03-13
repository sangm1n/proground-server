const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 리더 권한 부여
 */
exports.updateUserType = async function (profileImage, userId, introduction) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update User set userType = 'L', profileImage = ?, introduction = ? where userId = ?;
        `;
        const params = [profileImage, introduction, userId];
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

exports.checkLeader = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists (select userId from User where userId = ? and userType = 'L' and isDeleted = 'N') as exist;
        `;
        const params = [userId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkLeader DB Connection error\n: ${err.message}`);
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

exports.postChallengeCard = async function (challengeId, cardId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into ChallengeCard (challengeId, cardId) select ?, ? from dual
        where not exists (select challengeId, cardId from ChallengeCard where challengeId = ? and cardId = ?);
        `;
        const params = [challengeId, cardId, challengeId, cardId];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - postChallengeCard DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getRecentChallengeId = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select challengeId from Challenge order by createdAt desc limit 1;
        `;
        const [rows] = await connection.query(query);
        connection.release();

        return rows[0]['challengeId'];
    } catch (err) {
        logger.error(`App - getChallengeIdByName DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 미션 생성
 */
// 리더 체크
exports.checkNickname = async function (nickname) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists (select userId from User where nickname = ? and userType = 'L' and isDeleted = 'N') as exist;
        `;
        const params = [nickname];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkNickname DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// leaderId 조회
exports.getLeaderId = async function (nickname) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select userId from User where nickname = ? and isDeleted = 'N';
        `;
        const params = [nickname];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['userId'];
    } catch (err) {
        logger.error(`App - checkNickname DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 미션 생성
exports.insertMission = async function (leaderId, distance, time) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into Mission (leaderId, distance, time) values (?, ?, ?); 
        `;
        const params = [leaderId, distance, time];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - insertMission DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// maxDistance 변경
exports.changeMaxDistance = async function (level, maxDistance) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update Level set maxDistance = ? where level = ?;
        `;
        const params = [maxDistance, level];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - changeMaxDistance DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// maxMission 변경
exports.changeMaxMission = async function (level, maxMission) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update Level set maxMission = ? where level = ?;
        `;
        const params = [maxMission, level];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - changeMaxMission DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// levelColor 변경
exports.changeLevelColor = async function (level, levelColor) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update Level set levelColor = ? where level = ?;
        `;
        const params = [levelColor, level];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - changeLevelColor DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 공지 생성
 */
exports.postNotice = async function (title, content, image, banner) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into Notice (title, content, image, banner) values (?, ?, ?, ?);
        `;
        const params = [title, content, image, banner];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - postNotice DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * UserMission 생성
 */
exports.postUserMission = async function (userId, missionId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into UserMission (userId, missionId) select ?, ? from dual
        where not exists (select userId, missionId from UserMission where userId = ? and missionId = ? and isDeleted = 'N');
        `;
        const params = [userId, missionId, userId, missionId];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - postUserMission DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * UserCard 생성
 */
exports.postUserCard = async function (userId, cardId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into UserCard (userId, cardId) select ?, ? from dual
        where not exists (select userId, cardId from UserCard where userId = ? and cardId = ? and isDeleted = 'N');
        `;
        const params = [userId, cardId, userId, cardId];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - postUserCard DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getMissionInfo = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select userId,
            missionId,
            createdAt,
            timestampdiff(hour, now(), date_add(createdAt, interval 14 day)) as diff
        from UserMission
        where timestampdiff(hour, now(), date_add(createdAt, interval 14 day)) = 0;
        `;
        const [rows] = await connection.query(query);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getMissionInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.updateUserMission = async function (userId, missionId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update UserMission set isDeleted = 'Y' where userId = ? and missionId = ?;
        `;
        const params = [userId, missionId];
        const [rows] = await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - updateUserMission DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.insertChallengeLeader = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into UserChallenge (userId, challengeId) values (?, ?);
        `;
        const params = [userId, challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - insertChallengeLeader DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
