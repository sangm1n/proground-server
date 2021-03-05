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

// 러닝 Id 체크
exports.checkRunningId = async function (runningId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select runningId from Running where runningId = ? and isDeleted = 'N') as exist;
        `;
        const params = [runningId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - getRunningCount DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.checkRunningLike = async function (userId, runningId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select runningId from RunningLike where userId = ? and runningId = ?) as exist;
        `;
        const params = [userId, runningId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - getRunningCount DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 러닝 기록 좋아요
 */
exports.getLikeStatus = async function (userId, runningId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select status from RunningLike where userId = ? and runningId = ?;
        `;
        const params = [userId, runningId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['status'];
    } catch (err) {
        logger.error(`App - getLikeStatus DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.insertRunningLike = async function (userId, runningId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into RunningLike (userId, runningId) values (?, ?);
        `;
        const params = [userId, runningId];
        const [rows] = await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - insertRunningLike DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.patchRunningLike = async function (status, userId, runningId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update RunningLike set status = ? where userId = ? and runningId = ?;
        `;
        const params = [status, userId, runningId];
        const [rows] = await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - patchRunningLike DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 러닝 기록 삭제
exports.deleteRunning = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select runningId from Running where userId = ? and challengeId = ? and isDeleted = 'N';
        `;
        let params = [userId, challengeId];
        const [rows] = await connection.query(query, params);

        exist = `
        select exists(select runningId from RunningLike where runningId = ? and status = 'Y') as exist;
        `
        if (rows.length > 0) {
            for (var i = 0; i < rows.length; i++) {
                let runningId = rows[i].runningId;
                let [check] = await connection.query(exist, [runningId]);

                if (check[0]['exist'] === 1) {
                    query = `
                    update RunningLike set status = 'N' where runningId = ?;
                    `;
                    await connection.query(query, [runningId]);
                }
            }
        }

        query = `
        update Running set isDeleted = 'Y' where userId = ? and challengeId = ?;
        `;
        params = [userId, challengeId];
        await connection.query(query, params);

        connection.release();
    } catch (err) {
        logger.error(`App - deleteRunning DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 러닝 기록으로 runningId 받아오기
exports.getRunningId = async function (state, distance, startTime, endTime, pace, altitude, calorie) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select runningId from Running where ` + state + ` and distance = ? and startTime = ? and endTime = ? and pace = ? and altitude = ? and calorie = ? and isDeleted = 'N';
        `;
        const params = [distance, startTime, endTime, pace, altitude, calorie];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getRunningId DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 러닝 구간 페이스 기록
exports.postRunningSection = async function (runningId, distance, pace) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into RunningSection (runningId, distance, pace) values (?, ?, ?);
        `;
        const params = [runningId, distance, pace];
        await connection.query(query, params);
        connection.release();
    } catch (err) {
        logger.error(`App - postRunningSection DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getFcmByRunningId = async function (runningId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select nickname, fcmToken
        from Running r join User u on r.userId = u.userId
        where runningId = ?
        and r.isDeleted = 'N' and u.isDeleted = 'N' and isNotified = 'Y';
        `;
        const params = [runningId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getFcmByRunningId DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getMissionInfo = async function (missionId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select cast(distance as double) as distance, time, nickname
        from Mission m
                join User u on leaderId = u.userId
        where missionId = ?;
        `;
        const params = [missionId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getMissionInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.setMissionComplete = async function (pace, userId, missionId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update UserMission set complete = 'Y', pace = ? where userId = ? and missionId = ? and isDeleted = 'N';
        `;
        const params = [pace, userId, missionId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - setMissionComplete DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getMaxDistance = async function (level) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select maxDistance from Level where level = ?;
        `;
        const params = [level];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['maxDistance'];
    } catch (err) {
        logger.error(`App - setMissionComplete DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.updateUserLevel = async function (level, userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update UserLevel set level = ? where userId = ?;
        `;
        const params = [level, userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - updateUserLevel DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
