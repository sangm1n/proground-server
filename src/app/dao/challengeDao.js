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

exports.checkChallengeLevel = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select level
                from UserLevel
                where userId = ?
                and level between
                        (select minLevel from Challenge where challengeId = ? and isDeleted = 'N') and
                        (select maxLevel from Challenge where challengeId = ? and isDeleted = 'N')) as exist;
        `;
        const params = [userId, challengeId, challengeId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkChallengeLevel DB Connection error\n: ${err.message}`);
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

/***
 * 챌린지 통계
 */
// 챌린지 타입 가져오기
exports.getChallengeType = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select challengeType from Challenge where challengeId = ?;
        `;
        const params = [challengeId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['challengeType'];
    } catch (err) {
        logger.error(`App - getChallengeType DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getStatsInfo = async function (challengeId, userId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select r.userId,
            v.userName,
            v.challengeColor,
            v.levelColor,
            distance,
            if(w.likeCount is null, 0, w.likeCount) as likeCount
        from Running r
                join (select uc.userId, userName, challengeColor, x.levelColor, uc.isDeleted
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                                join (select ul.userId, levelColor
                                    from Level l
                                            join UserLevel ul on l.level = ul.level) x on u.userId = x.userId
                    where u.isDeleted = 'N'
                        and userType = 'G'
                    group by uc.userId) v on r.userId = v.userId
                left join (select r.runningId, count(rl.runningId) as likeCount
                            from Running r
                                    join RunningLike rl on r.runningId = rl.runningId
                            where rl.status = 'Y') w on r.runningId = w.runningId
        where r.challengeId = ?
        and v.isDeleted = 'N'
        and r.isDeleted = 'N'
        and v.challengeColor = (select challengeColor from UserChallenge where userId = ? and challengeId = ?)
        and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
        and endTime <= str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H')
        order by distance desc
        limit ` + page + `, ` + size + `;
        `;
        const params = [challengeId, userId, challengeId, page, size];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getStatsInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getStatsTotalInfo = async function (challengeId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select r.userId,
            v.userName,
            v.challengeColor,
            v.levelColor,
            distance,
            if(w.likeCount is null, 0, w.likeCount) as likeCount
        from Running r
                join (select uc.userId, userName, challengeColor, x.levelColor, uc.isDeleted
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                                join (select ul.userId, levelColor
                                    from Level l
                                            join UserLevel ul on l.level = ul.level) x on u.userId = x.userId
                    where u.isDeleted = 'N'
                        and userType = 'G'
                    group by uc.userId) v on r.userId = v.userId
                left join (select r.runningId, count(rl.runningId) as likeCount
                            from Running r
                                    join RunningLike rl on r.runningId = rl.runningId
                            where rl.status = 'Y') w on r.runningId = w.runningId
        where r.challengeId = ?
        and v.isDeleted = 'N'
        and r.isDeleted = 'N'
        order by distance desc
        limit ` + page + `, ` + size + `;
        `;
        const params = [challengeId, page, size];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getStatsTotalInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}