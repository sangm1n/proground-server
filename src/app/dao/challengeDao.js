const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 챌린지 조회
 */
// 챌린지 체크
exports.checkChallenge = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select challengeId from Challenge where challengeId = ? and isDeleted = 'N') as exist;
        `;
        const params = [challengeId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getAllChallenges = async function (page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select c.challengeId,
            image,
            minLevel,
            maxLevel,
            personnel,
            concat(challengeName, ' with ', nickname) as challengeName,
            if(challengeType = 'A', '목표달성', '경쟁전')    as challengeType,
            distance,
            (endDate - startDate)                     as period
        from Challenge c
                join UserChallenge uc on c.challengeId = uc.challengeId
                join User u on uc.userId = u.userId
        where c.isDeleted = 'N'
        and uc.isDeleted = 'N'
        and u.isDeleted = 'N'
        and userType in ('A', 'L')
        limit ` + page + `, ` + size + `;
        `;
        const params = [page, size];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getAllChallenges DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getMyChallenge = async function (userId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select c.challengeId,
            image,
            minLevel,
            maxLevel,
            if(challengeType = 'A', '목표달성', '경쟁전')      as challengeType,
            concat(challengeName, ' with ', w.nickname) as challengeName,
            distance,
            v.userCount,
            personnel,
            date_format(startDate, '%y.%m.%d')          as startDate,
            date_format(endDate, '%y.%m.%d')            as endDate
        from Challenge c
                join UserChallenge uc on c.challengeId = uc.challengeId
                join (select u.userId, nickname, uc.challengeId
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                    where u.isDeleted = 'N') w
                    on c.challengeId = w.challengeId
                join (select count(userId) as userCount, uc.challengeId
                    from UserChallenge uc
                                join Challenge c on uc.challengeId = c.challengeId
                    where uc.isDeleted = 'N'
                        and c.isDeleted = 'N'
                        and uc.challengeColor is not null
                    group by uc.challengeId) v
                    on uc.challengeId = v.challengeId
        where c.isDeleted = 'N'
        and uc.isDeleted = 'N'
        and uc.userId = ?
        group by challengeId
        limit ` + page + `, ` + size + `;
        `;
        const params = [userId, page, size];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getMyChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 개별 챌린지 조회
exports.getChallenge = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select c.challengeId,
            image,
            challengeName,
            introduction,
            distance,
            if(challengeType = 'A', '목표달성', '경쟁전') as challengeType,
            v.userCount,
            personnel,
            minLevel,
            maxLevel,
            (endDate - startDate)                  as period,
            timestampdiff(day, now(), startDate)   as beforeDate,
            date_format(startDate, '%Y.%c.%e')     as startDate,
            date_format(endDate, '%c.%e')          as endDate
        from Challenge c
                join UserChallenge uc on c.challengeId = uc.challengeId
                join (select count(userId) as userCount, uc.challengeId
                    from UserChallenge uc
                                join Challenge c on uc.challengeId = c.challengeId
                    where uc.isDeleted = 'N'
                        and c.isDeleted = 'N'
                        and uc.challengeColor is not null
                    group by uc.challengeId) v
                    on uc.challengeId = v.challengeId
        where c.isDeleted = 'N'
        and uc.isDeleted = 'N'
        and c.challengeId = ?
        group by c.challengeId;
        `;
        const params = [challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 리더 정보
exports.getLeader = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select u.userId, profileImage, introduction
        from User u
                join UserChallenge uc on u.userId = uc.userId
        where challengeId = ?
        group by uc.challengeId;
        `;
        const params = [challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getLeader DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 카드
exports.getCard = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select cardId, title, subTitle
        from Card
        where isDeleted = 'N'
        and challengeId = ?;
        `;
        const params = [challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getCard DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 색상
exports.getColor = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select firstTeamName, firstColor, secondTeamName, secondColor
        from Challenge
        where challengeId = ?;
        `;
        const params = [challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getColor DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 챌린지 참가
 */
exports.checkRegisterChallenge = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select userId from UserChallenge where userId = ? and challengeId = ? and isDeleted = 'N') as exist;
        `;
        const params = [userId, challengeId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkRegisterChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.postChallenge = async function (userId, challengeId, challengeColor) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into UserChallenge (userId, challengeId, challengeColor)
        values (?, ?, ?);
        `;
        const params = [userId, challengeId, challengeColor];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - postChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 챌린지 탈퇴
 */
exports.withdrawChallenge = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update UserChallenge
        set isDeleted = 'Y'
        where userId = ?
        and challengeId = ?;
        `;
        const params = [userId, challengeId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - checkRegisterChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
