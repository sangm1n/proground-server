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
        select distinct c.challengeId,
                        image,
                        minLevel,
                        maxLevel,
                        personnel,
                        if(challengeType = 'B', concat(challengeName, ' with ', nickname), challengeName) as challengeName,
                        if(challengeType = 'A', '목표달성', '경쟁전')                                            as challengeType,
                        distance,
                        timestampdiff(day, startDate, endDate)                                            as period,
                        if(timestampdiff(second, now(),
                                        str_to_date(date_format(endDate, '%Y-%m-%d 23:59:59'), '%Y-%m-%d %H:%i:%s')) < 0,
                        'Y', 'N')                                                                      as isFinished
        from Challenge c
                left join (select u.userId, challengeId, nickname
                            from UserChallenge uc
                                    join User u on uc.userId = u.userId
                            where userType in ('A', 'L')
                            and uc.isDeleted = 'N'
                            and u.isDeleted = 'N') v
                        on c.challengeId = v.challengeId
        where c.isDeleted = 'N'
        order by endDate desc
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
            if(challengeType = 'A', concat(challengeName, ' with ', w.nickname) ,challengeName) as challengeName,
            distance,
            v.userCount,
            personnel,
            date_format(startDate, '%y.%m.%d')          as startDate,
            date_format(endDate, '%y.%m.%d')            as endDate,
            cast(round((timestampdiff(day, startDate, now()) + 1) /
                (timestampdiff(day, startDate, endDate) + 1) * 100) as unsigned) as ratio
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

exports.getLeaderMyChallenge = async function (userId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select c.challengeId,
            image,
            minLevel,
            maxLevel,
            if(challengeType = 'A', '목표달성', '경쟁전')                                              as challengeType,
            if(challengeType = 'A', concat(challengeName, ' with ', w.nickname), challengeName) as challengeName,
            distance,
            ifnull(v.userCount, 0)                                                              as userCount,
            personnel,
            date_format(startDate, '%y.%m.%d')                                                  as startDate,
            date_format(endDate, '%y.%m.%d')                                                    as endDate,
            cast(round((timestampdiff(day, startDate, now()) + 1) /
                        (timestampdiff(day, startDate, endDate) + 1) * 100) as unsigned)         as ratio
        from Challenge c
                join UserChallenge uc on c.challengeId = uc.challengeId
                join (select u.userId, nickname, uc.challengeId
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                    where u.isDeleted = 'N') w
                    on c.challengeId = w.challengeId
                left join (select count(userId) as userCount, uc.challengeId
                            from UserChallenge uc
                                    join Challenge c on uc.challengeId = c.challengeId
                            where uc.isDeleted = 'N'
                            and c.isDeleted = 'N'
                            and uc.challengeColor is not null
                            group by uc.challengeId) v
                        on c.challengeId = v.challengeId
        where c.isDeleted = 'N'
        and uc.isDeleted = 'N'
        and uc.challengeColor is null
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
        logger.error(`App - getLeaderMyChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 개별 챌린지 조회
exports.challengeEndDate = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select endDate from Challenge where challengeId = ? and isDeleted = 'N';
        `;
        const params = [challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['endDate'];
    } catch (err) {
        logger.error(`App - challengeEndDate DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

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
            timestampdiff(day, startDate, endDate) + 1                  as period,
            timestampdiff(day, now(), startDate)   as beforeDate,
            date_format(startDate, '%Y.%c.%e')     as startDate,
            date_format(endDate, '%Y.%c.%e')       as endDate
        from Challenge c
                left join UserChallenge uc on c.challengeId = uc.challengeId
                join (select ifnull(count(userId), 0) as userCount, c.challengeId
                    from UserChallenge uc
                                right join Challenge c on uc.challengeId = c.challengeId
                    where c.isDeleted = 'N'
                        and case
                                when userId is not null then uc.isDeleted = 'N'
                                    and uc.challengeColor is not null
                                else 1 end
                    group by c.challengeId) v
                    on c.challengeId = v.challengeId
        where c.isDeleted = 'N'
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

exports.getChallengeMembers = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select count(userId) as countUsers from UserChallenge where challengeId = ? and isDeleted = 'N';
        `;
        const params = [challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['countUsers'];
    } catch (err) {
        logger.error(`App - getChallengeMembers DB Connection error\n: ${err.message}`);
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
        select c.cardId, title, subTitle from Card c join ChallengeCard cc on c.cardId = cc.cardId where challengeId = ? and c.isDeleted = 'N';
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
exports.checkMaxChallenge = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select count(challengeId) as countChallenge from UserChallenge where userId = ? and isDeleted = 'N';
        `;
        const params = [userId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['countChallenge'];
    } catch (err) {
        logger.error(`App - checkMaxChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

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

exports.postChallenge = async function (userId, challengeId, challengeColor, challengeTeamName) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into UserChallenge (userId, challengeId, lastReadTime, challengeColor, challengeTeamName)
        select ?, ?, null, ?, ? from dual
        where not exists (select * from UserChallenge where userId = ? and challengeId = ? and challengeColor = ? and challengeTeamName = ?);
        `;
        const params = [userId, challengeId, challengeColor, challengeTeamName, userId, challengeId, challengeColor, challengeTeamName];
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
        let query = `
        update UserChallenge
        set isDeleted = 'Y'
        where userId = ?
        and challengeId = ?;
        `;
        const params = [userId, challengeId];
        await connection.query(query, params);
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

// 챌린지 팀 가져오기
exports.getChallengeTeam = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select challengeTeamName from UserChallenge where userId = ? and challengeId = ?;
        `;
        const params = [userId, challengeId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['challengeTeamName'];
    } catch (err) {
        logger.error(`App - getChallengeTeam DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getStatsInfo = async function (userId, challengeId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select r.userId,
            v.nickname,
            v.profileImage,
            v.levelColor,
            v.challengeTeamName,
            cast(sum(distance) as double) as distance,
            ifnull(sum(w.likeCount), 0) as likeCount,
            if(r.userId = ?, 'Y', 'N') as myself
        from Running r
                join (select uc.userId, nickname, x.levelColor, uc.isDeleted, challengeTeamName, profileImage
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                                join (select ul.userId, levelColor
                                    from Level l
                                            join UserLevel ul on l.level = ul.level) x on u.userId = x.userId
                    where u.isDeleted = 'N'
                        and uc.isDeleted = 'N'
                        and userType = 'G'
                        and uc.challengeId = ?
                    group by uc.userId) v on r.userId = v.userId
                left join (select r.runningId, count(rl.runningId) as likeCount
                            from Running r
                                    join RunningLike rl on r.runningId = rl.runningId
                            where rl.status = 'Y' group by r.runningId) w on r.runningId = w.runningId
        where r.challengeId = ?
        and v.isDeleted = 'N'
        and r.isDeleted = 'N'
        and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
        and endTime <= str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H')
        group by userId
        order by distance desc
        limit ` + page + `, ` + size + `;
        `;
        const params = [userId, challengeId, challengeId, page, size];
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

exports.getGoalStatsInfo = async function (userId, challengeId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select r.userId,
            v.nickname,
            v.profileImage,
            v.levelColor,
            cast(sum(distance) as double) as distance,
            ifnull(sum(w.likeCount), 0) as likeCount,
            if(r.userId = ?, 'Y', 'N') as myself
        from Running r
                join (select uc.userId, nickname, x.levelColor, uc.isDeleted, challengeTeamName, profileImage
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                                join (select ul.userId, levelColor
                                    from Level l
                                            join UserLevel ul on l.level = ul.level) x on u.userId = x.userId
                    where u.isDeleted = 'N'
                        and uc.isDeleted = 'N'
                        and userType = 'G'
                        and uc.challengeId = ?
                    group by uc.userId) v on r.userId = v.userId
                left join (select r.runningId, count(rl.runningId) as likeCount
                            from Running r
                                    join RunningLike rl on r.runningId = rl.runningId
                            where rl.status = 'Y' group by r.runningId) w on r.runningId = w.runningId
        where r.challengeId = ?
        and v.isDeleted = 'N'
        and r.isDeleted = 'N'
        and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
        and endTime <= str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H')
        group by userId
        order by distance desc
        limit ` + page + `, ` + size + `;
        `;

        const params = [userId, challengeId, challengeId, page, size];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
        
        return rows;
    } catch (err) {
        logger.error(`App - getGoalStatsInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getStatsTotalInfo = async function (userId, challengeId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select r.userId,
            v.nickname,
            v.profileImage,
            v.levelColor,
            v.challengeTeamName,
            cast(sum(distance) as double) as distance,
            ifnull(sum(w.likeCount), 0) as likeCount,
            if(r.userId = ?, 'Y', 'N') as myself
        from Running r
                join (select uc.userId, nickname, x.levelColor, uc.isDeleted, challengeTeamName, profileImage
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                                join (select ul.userId, levelColor
                                    from Level l
                                            join UserLevel ul on l.level = ul.level) x on u.userId = x.userId
                    where u.isDeleted = 'N'
                        and uc.isDeleted = 'N'
                        and userType = 'G'
                        and uc.challengeId = ?
                    group by uc.userId) v on r.userId = v.userId
                left join (select r.runningId, count(rl.runningId) as likeCount
                            from Running r
                                    join RunningLike rl on r.runningId = rl.runningId
                            where rl.status = 'Y' group by r.runningId) w on r.runningId = w.runningId
        where r.challengeId = ?
        and v.isDeleted = 'N'
        and r.isDeleted = 'N'
        group by userId
        order by distance desc
        limit ` + page + `, ` + size + `;
        `;
        const params = [userId, challengeId, challengeId, page, size];
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

exports.getGoalStatsTotalInfo = async function (userId, challengeId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select r.userId,
            v.nickname,
            v.profileImage,
            v.levelColor,
            cast(sum(distance) as double) as distance,
            ifnull(sum(w.likeCount), 0) as likeCount,
            if(r.userId = ?, 'Y', 'N') as myself
        from Running r
                join (select uc.userId, nickname, x.levelColor, uc.isDeleted, challengeTeamName, profileImage
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                                join (select ul.userId, levelColor
                                    from Level l
                                            join UserLevel ul on l.level = ul.level) x on u.userId = x.userId
                    where u.isDeleted = 'N'
                        and uc.isDeleted = 'N'
                        and userType = 'G'
                        and uc.challengeId = ?
                    group by uc.userId) v on r.userId = v.userId
                left join (select r.runningId, count(rl.runningId) as likeCount
                            from Running r
                                    join RunningLike rl on r.runningId = rl.runningId
                            where rl.status = 'Y' group by r.runningId) w on r.runningId = w.runningId
        where r.challengeId = ?
        and v.isDeleted = 'N'
        and r.isDeleted = 'N'
        group by userId
        order by distance desc
        limit ` + page + `, ` + size + `;
        `;
        const params = [userId, challengeId, challengeId, page, size];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getGoalStatsTotalInfo DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getCompetitionGraphToday = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select firstColor, secondColor, firstTeamName, secondTeamName
        from Challenge
        where challengeId = ?
        and isDeleted = 'N';
        `;
        let params = [challengeId];
        let [rows] = await connection.query(query, params);
        
        const firstColor = rows[0].firstColor;
        const secondColor = rows[0].secondColor;
        const firstTeam = rows[0].firstTeamName;
        const secondTeam = rows[0].secondTeamName;

        query = `
        select ifnull(challengeColor, '` + firstColor + `') as challengeColor,
                ifnull(challengeTeamName, '` + firstTeam + `') as challengeTeamName,
                cast(ifnull(sum(distance), 0) as double) as totalDistance
        from Running r
                join UserChallenge uc on r.userId = uc.userId
        where r.challengeId = ?
        and uc.challengeColor = '` + firstColor + `'
        and challengeTeamName is not null
        and r.isDeleted = 'N'
        and uc.isDeleted = 'N'
        and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
        and endTime <= str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H');
        `;
        let [firstRows] = await connection.query(query, params);

        query = `
        select ifnull(challengeColor, '` + secondColor + `') as challengeColor,
                ifnull(challengeTeamName, '` + secondTeam + `') as challengeTeamName,
                cast(ifnull(sum(distance), 0) as double) as totalDistance
        from Running r
                join UserChallenge uc on r.userId = uc.userId
        where r.challengeId = ?
        and uc.challengeColor = '` + secondColor + `'
        and challengeTeamName is not null
        and r.isDeleted = 'N'
        and uc.isDeleted = 'N'
        and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
        and endTime <= str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H');
        `;
        let [secondRows] = await connection.query(query, params);    
        
        query = `
        select distance, personnel, timestampdiff(day, startDate, endDate) + 1 as period from Challenge where challengeId = ?;
        `
        let [thirdRows] = await connection.query(query, params);

        const maximum = parseFloat((thirdRows[0].distance / thirdRows[0].period)).toFixed(2);
        const firstDist = parseFloat(firstRows[0].totalDistance).toFixed(2);
        const secondDist = parseFloat(secondRows[0].totalDistance).toFixed(2);

        const firstRatio = ((firstDist / maximum) * 100).toFixed(2);
        const secondRatio = ((secondDist / maximum) * 100).toFixed(2);

        firstRows[0].ratio = parseFloat(firstRatio);
        secondRows[0].ratio = parseFloat(secondRatio);

        connection.release();

        return [firstRows[0], secondRows[0]]
    } catch (err) {
        logger.error(`App - getCompetitionGraphToday DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getCompetitionGraphTotal = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select firstColor, secondColor, firstTeamName, secondTeamName
        from Challenge
        where challengeId = ?
        and isDeleted = 'N';
        `;
        let params = [challengeId];
        let [rows] = await connection.query(query, params);
        
        const firstColor = rows[0].firstColor;
        const secondColor = rows[0].secondColor;
        const firstTeam = rows[0].firstTeamName;
        const secondTeam = rows[0].secondTeamName;

        query = `
        select ifnull(challengeColor, '` + firstColor + `') as challengeColor,
                ifnull(challengeTeamName, '` + firstTeam + `') as challengeTeamName,
                cast(ifnull(sum(distance), 0) as double) as totalDistance
        from Running r
                join UserChallenge uc on r.userId = uc.userId
        where r.challengeId = ?
        and uc.challengeColor = '` + firstColor + `'
        and challengeTeamName is not null
        and r.isDeleted = 'N'
        and uc.isDeleted = 'N';
        `;
        const [firstRows] = await connection.query(query, params);

        query = `
        select ifnull(challengeColor, '` + secondColor + `') as challengeColor,
                ifnull(challengeTeamName, '` + secondTeam + `') as challengeTeamName,
                cast(ifnull(sum(distance), 0) as double) as totalDistance
        from Running r
                join UserChallenge uc on r.userId = uc.userId
        where r.challengeId = ?
        and uc.challengeColor = '` + secondColor + `'
        and challengeTeamName is not null
        and r.isDeleted = 'N'
        and uc.isDeleted = 'N';
        `;
        const [secondRows] = await connection.query(query, params);

        query = `
        select distance, personnel, timestampdiff(day, startDate, endDate) + 1 as period from Challenge where challengeId = ?;
        `
        let [thirdRows] = await connection.query(query, params);

        const maximum = parseFloat(thirdRows[0].distance).toFixed(2);
        const firstDist = parseFloat(firstRows[0].totalDistance).toFixed(2);
        const secondDist = parseFloat(secondRows[0].totalDistance).toFixed(2);

        const firstRatio = ((firstDist / maximum) * 100).toFixed(2);
        const secondRatio = ((secondDist / maximum) * 100).toFixed(2);

        firstRows[0].ratio = parseFloat(firstRatio);
        secondRows[0].ratio = parseFloat(secondRatio);

        connection.release();

        return [firstRows[0], secondRows[0]]
    } catch (err) {
        logger.error(`App - getCompetitionGraphToday DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getGoalGraphToday = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select u.userId, 
            v.nickname, 
            v.profileImage, 
            v.levelColor, 
            cast(ifnull(w.distance, 0.00) as double) as distance, 
            cast(ifnull(sum(u.likeCount), 0) as double) as likeCount
        from Running r
            join User u
            join (select uc.userId, nickname, x.levelColor, uc.isDeleted, challengeTeamName, profileImage
                from User u
                            join UserChallenge uc on u.userId = uc.userId
                            join (select ul.userId, levelColor
                                from Level l
                                        join UserLevel ul on l.level = ul.level) x on u.userId = x.userId
                where u.isDeleted = 'N'
                    and uc.isDeleted = 'N'
                    and userType = 'G'
                    and uc.challengeId = ?) v on u.userId = v.userId
            left join (select r.runningId, count(likeId) as likeCount
                from RunningLike rl
                            join Running r on rl.runningId = r.runningId
                where challengeId = ?
                    and r.userId = ?
                    and rl.status = 'Y'
                    and r.isDeleted = 'N'
                    and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
                    and endTime <=
                        str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H')) u
                on r.runningId = u.runningId
            join (select ifnull(sum(distance), 0) as distance
                from Running r
                where challengeId = ?
                    and userId = ?
                    and isDeleted = 'N'
                    and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
                    and endTime <=
                        str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H')) w
        where u.userId = ?
        and challengeId = ?
        and r.isDeleted = 'N'
        group by u.userId;
        `;
        let params = [challengeId, challengeId, userId, challengeId, userId, userId, challengeId];
        const [firstRows] = await connection.query(query, params);

        query = `
        select r.challengeId, challengeColor, challengeTeamName, cast(ifnull(w.distance, 0.00) as double) as distance, cast(ifnull(sum(u.likeCount), 0) as double) as likeCount
        from Running r
            join UserChallenge uc on r.challengeId = uc.challengeId
            left join (select r.runningId, count(likeId) as likeCount
                from RunningLike rl
                            join Running r on rl.runningId = r.runningId
                where challengeId = ?
                    and rl.status = 'Y'
                    and r.isDeleted = 'N'
                    and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
                    and endTime <=
                        str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H')) u
                on r.runningId = u.runningId
            join (select ifnull(sum(distance), 0) as distance
                from Running r
                where challengeId = ?
                    and isDeleted = 'N'
                    and str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H') <= endTime
                    and endTime <=
                        str_to_date(date_format(date_add(now(), interval +1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H')) w
        where r.challengeId = ? and challengeColor is not null
        and r.isDeleted = 'N';
        `
        params = [challengeId, challengeId, challengeId];
        const [secondRows] = await connection.query(query, params);

        query = `
        select distance, personnel, timestampdiff(day, startDate, endDate) + 1 as period from Challenge where challengeId = ?;
        `
        let [thirdRows] = await connection.query(query, params);

        const userMax = parseFloat((thirdRows[0].distance / thirdRows[0].period)).toFixed(2);
        const teamMax = parseFloat((thirdRows[0].distance / thirdRows[0].period * thirdRows[0].personnel)).toFixed(2);

        const firstDist = parseFloat(firstRows[0].distance).toFixed(2);
        const secondDist = parseFloat(secondRows[0].distance).toFixed(2);

        const firstRatio = ((firstDist / userMax) * 100).toFixed(2);
        const secondRatio = ((secondDist / teamMax) * 100).toFixed(2);

        firstRows[0].ratio = parseFloat(firstRatio);
        secondRows[0].ratio = parseFloat(secondRatio);

        connection.release();

        return [firstRows[0], secondRows[0]];
    } catch (err) {
        logger.error(`App - getGoalGraphToday DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}


exports.getGoalGraphTotal = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select r.userId,
            v.nickname,
            cast(ifnull(round((w.distance / c.distance) * 100, 1), 0.00) as double) as ratio,
            cast(ifnull(round(w.distance, 1), 0.00) as double)                      as distance,
            cast(ifnull(sum(u.likeCount), 0) as double) as likeCount
        from Running r
                join User u
                join Challenge c on r.challengeId = c.challengeId
                join (select uc.userId, nickname, uc.isDeleted, challengeTeamName, profileImage
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                    where u.isDeleted = 'N'
                        and uc.isDeleted = 'N'
                        and userType = 'G'
                        and uc.challengeId = ?) v on r.userId = v.userId
                left join (select r.runningId, count(likeId) as likeCount
                    from RunningLike rl
                                join Running r on rl.runningId = r.runningId
                    where challengeId = ?
                        and r.userId = ?
                        and rl.status = 'Y'
                        and r.isDeleted = 'N') u
                    on r.runningId = u.runningId
                join (select ifnull(sum(distance), 0) as distance
                    from Running r
                    where challengeId = ?
                        and userId = ?
                        and isDeleted = 'N') w
        where u.userId = ?
        and r.challengeId = ?
        and r.isDeleted = 'N'
        and c.isDeleted = 'N'
        group by r.userId;
        `;
        let params = [challengeId, challengeId, userId, challengeId, userId, userId, challengeId];
        const [firstRows] = await connection.query(query, params);

        query = `
        select c.challengeId,
            v.challengeColor, challengeTeamName,
            cast(ifnull(round((w.distance / c.distance) * 100, 1), 0.00) as double) as ratio,
            cast(ifnull(round(w.distance, 1), 0.00) as double)                   as distance,
            cast(ifnull(sum(u.likeCount), 0) as double) as likeCount
        from Running r
                join Challenge c on r.challengeId = c.challengeId
                join (select uc.userId, nickname, uc.isDeleted, challengeColor, challengeTeamName, profileImage
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                    where u.isDeleted = 'N'
                        and uc.isDeleted = 'N'
                        and userType = 'G'
                        and uc.challengeId = ?) v on r.userId = v.userId
                left join (select r.runningId, count(likeId) as likeCount
                    from RunningLike rl
                                join Running r on rl.runningId = r.runningId
                    where challengeId = ?
                        and rl.status = 'Y'
                        and r.isDeleted = 'N') u
                    on r.runningId = u.runningId
                join (select ifnull(sum(distance), 0) as distance
                    from Running r
                    where challengeId = ?
                        and isDeleted = 'N') w
        where r.challengeId = ?
        and r.isDeleted = 'N'
        and c.isDeleted = 'N';
        `
        params = [challengeId, challengeId, challengeId, challengeId];
        const [secondRows] = await connection.query(query, params);

        query = `
        select distance, personnel, timestampdiff(day, startDate, endDate) + 1 as period from Challenge where challengeId = ?;
        `
        let [thirdRows] = await connection.query(query, params);

        const userMax = parseFloat(thirdRows[0].distance).toFixed(2);
        const teamMax = parseFloat(thirdRows[0].distance * thirdRows[0].personnel).toFixed(2);

        const firstDist = parseFloat(firstRows[0].distance).toFixed(2);
        const secondDist = parseFloat(secondRows[0].distance).toFixed(2);

        const firstRatio = ((firstDist / userMax) * 100).toFixed(2);
        const secondRatio = ((secondDist / teamMax) * 100).toFixed(2);

        firstRows[0].ratio = parseFloat(firstRatio);
        secondRows[0].ratio = parseFloat(secondRatio);

        connection.release();
        return [firstRows[0], secondRows[0]];
    } catch (err) {
        logger.error(`App - getGoalGraphTotal DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 오늘 마감인 챌린지
exports.todayChallenge = async function (endDate) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select challengeId from Challenge where endDate = ?;
        `;
        const params = [endDate];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - todayChallenge DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 상태 변경
exports.challengeResult = async function (challengeId, status) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update UserChallenge set winStatus = ? where challengeId = ? and challengeColor is not null and isDeleted = 'N';
        `;
        const params = [status, challengeId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - challengeResult DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 챌린지 달성 여부 비교
exports.challengeStatus = async function (challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select distance
        from Challenge
        where challengeId = ?
        and isDeleted = 'N';
        `;
        let params = [challengeId];
        const [distance] = await connection.query(query, params);

        query = `
        select v.totalDistance + x.totalDistance as totalDistance
        from (select cast(ifnull(sum(distance), 0) as double) as totalDistance
            from Running r
                    join NonUser nu on r.nonUserId = nu.nonUserId
            where isSignedUp = 'N'
                and r.isDeleted = 'N'
                and nu.isDeleted = 'N'
                and challengeId = ?) v,
            (select cast(ifnull(sum(distance), 0) as double) as totalDistance
            from Running r
                    join User u on r.userId = u.userId
            where u.userType = 'G'
                and r.isDeleted = 'N'
                and u.isDeleted = 'N'
                and challengeId = ?) x;
        `;
        params = [challengeId, challengeId];
        const [totalDistance] = await connection.query(query, params);

        connection.release();

        return {distance: distance[0]['distance'], totalDistance: totalDistance[0]['totalDistance']};
    } catch (err) {
        logger.error(`App - challengeStatus DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
