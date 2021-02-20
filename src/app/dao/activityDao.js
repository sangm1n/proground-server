const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 회원 러닝 통계 조회
 */
// 최근 7일
exports.getRecentRunning = async function (state, maxValue) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select sum(v.distance) as totalDistance
        from (select distinct startTime, endTime, distance
            from Running
            where ` + state + `
                and isDeleted = 'N'
                and str_to_date(date_format(date_sub(now(), interval 6 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H:%i') < endTime
                and endTime <
                    str_to_date(date_format(date_add(now(), interval 1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H:%i')) as v;
        `;
        const [firstRows] = await connection.query(query);

        query = `
        select ifnull(sum(v.distance), 0.00) as distance,
            ifnull(round((sum(v.distance) / ` + maxValue + `) * 100, 2), 0.00) as ratio,
            if(date_format(w.date, '%c/%e') = date_format(now(), '%c/%e'), 'Today', date_format(w.date, '%c/%e')) as date
        from (select distinct startTime, endTime, distance
            from Running
                where ` + state + `
                        and isDeleted = 'N'
                        and str_to_date(date_format(date_sub(now(), interval 6 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H:%i') < endTime
                        and endTime <
                            str_to_date(date_format(date_add(now(), interval 1 day), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H:%i')) v
            right join (select a.date
                from (
                        select (curdate() - INTERVAL (a.a + (10 * b.a) + (100 * c.a) + (1000 * d.a)) DAY) as date
                            from (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as a
                                    cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as b
                                    cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as c
                                    cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as d
        ) as a where a.date between date_sub(now(), interval 7 day) and date_add(now(), interval 1 day)) w on w.date = str_to_date(date_format(v.endTime, '%Y-%m-%d 00:00:00'), '%Y-%m-%d')
        group by w.date;
        `
        const [secondRows] = await connection.query(query);

        connection.release();

        return [firstRows[0], secondRows];
    } catch (err) {
        logger.error(`App - getRecentRunning DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 누적 러닝
exports.getTotalRunning = async function (state) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select v.totalDay,
            round(sum(r.distance), 2)              as totalDistance,
            round(sum(r.distance) / v.totalDay, 2) as avgDistance,
            case
                when round(sum(r.time) / v.totalDay) < 60
                    then concat('00:', lpad(round(sum(r.time) / v.totalDay), 2, 0))
                when round(sum(r.time) / v.totalDay) >= 60 and round(sum(r.time) / v.totalDay) < 3600
                    then concat(lpad(round((sum(r.time) / v.totalDay) div 60), 2, 0), ':',
                                lpad(round(sum(r.time) / v.totalDay) % 60, 2, 0))
                when round(sum(r.time) / v.totalDay) >= 3600
                    then concat(lpad(round((sum(r.time) / v.totalDay) div 3600), 2, 0), ':',
                                lpad(round((sum(r.time) / v.totalDay) % 3600) div 60, 2, 0), ':',
                                lpad(round((sum(r.time) / v.totalDay) % 3600) % 60, 2, 0))
                end
                                                    as avgTime,
            round(sum(r.pace) / v.totalDay, 2)     as avgPace,
            sum(r.calorie)                         as totalCalorie
        from (select distinct startTime, distance, pace, calorie, timestampdiff(second, startTime, endTime) as time
            from Running
            where ` + state + `
                and isDeleted = 'N' and endTime <= now()) as r,
            (select count(distinct date_format(startTime, '%Y-%m-%d')) as totalDay
            from Running
            where ` + state +`
                and isDeleted = 'N') as v;
        `;
        const [rows] = await connection.query(query);

        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getRecentRunning DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 러닝 기록
exports.getRunningHistory = async function (state) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select r.runningId,
            distance,
            case
                when timestampdiff(minute, startTime, endTime) < 1
                    then concat('00:', lpad(concat(timestampdiff(second, startTime, endTime)), 2, 0))
                when timestampdiff(minute, startTime, endTime) >= 1 and
                        timestampdiff(minute, startTime, endTime) < 60
                    then concat(lpad(concat(timestampdiff(minute, startTime, endTime)), 2, 0), ':',
                                lpad(concat(timestampdiff(second, startTime, endTime) -
                                            timestampdiff(minute, startTime, endTime) * 60), 2, 0))
                when timestampdiff(minute, startTime, endTime) >= 60
                    then concat(lpad(concat(timestampdiff(hour, startTime, endTime)), 2, 0), ':',
                                lpad(concat(timestampdiff(minute, startTime, endTime) -
                                            timestampdiff(hour, startTime, endTime) * 60), 2, 0), ':',
                                lpad(concat(timestampdiff(second, startTime, endTime) -
                                            timestampdiff(minute, startTime, endTime) * 60), 2, 0))
                end                          as time,
            pace,
            calorie,
            ifnull(v.likeCount, 0)           as likeCount,
            date_format(endTime, '%Y.%m.%d') as endTime
        from Running r
                left join (select r.runningId, count(likeId) as likeCount
                            from RunningLike rl
                                    join Running r on rl.runningId = r.runningId
                            where status = 'Y'
                            group by r.runningId) v on r.runningId = v.runningId
        where ` + state + `
        and isDeleted = 'N'
        group by endTime
        order by endTime desc;
        `;
        const [rows] = await connection.query(query);

        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getRunningHistory DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 카드 기록
exports.getCardHistory = async function (userId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select c.cardId,
            title,
            subTitle,
            cardImage,
            userName,
            profileImage,
            date_format(uc.createdAt, '%Y.%m.%d') as createdAt
        from Card c
                join UserCard uc on c.cardId = uc.cardId
                join User u on u.userId = uc.userId
        where u.userId = ?
        and u.isDeleted = 'N'
        and uc.isDeleted = 'N'
        and c.isDeleted = 'N'
        limit ?, ?
        `;
        const params = [userId, Number(page), Number(size)];
        const [rows] = await connection.query(query, params);

        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getCardHistory DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 챌린지 기록
exports.getChallengeHistory = async function (userId, page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select c.challengeId,
            image,
            concat(challengeName, ' with ', w.nickname) as challengeName,
            minLevel,
            maxLevel,
            c.distance,
            v.distance                                  as totalDistance,
            if(challengeType = 'A', '목표달성', '경쟁전')      as challengeType,
            date_format(startDate, '%y.%m.%d')          as startDate,
            date_format(endDate, '%y.%m.%d')            as endDate
        from Challenge c
                join UserChallenge uc on c.challengeId = uc.challengeId
                join (select u.userId, nickname, uc.challengeId
                    from User u
                                join UserChallenge uc on u.userId = uc.userId
                    where u.isDeleted = 'N') w
                    on c.challengeId = w.challengeId
                join (select runningId, challengeId, userId, sum(distance) as distance
                    from Running
                    where userId = ? and isDeleted = 'N'
                    group by challengeId) v on c.challengeId = v.challengeId
        where c.isDeleted = 'N'
        and uc.isDeleted = 'N'
        and uc.userId = ?
        and endDate < str_to_date(date_format(now(), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H')
        group by challengeId
        order by endDate desc
        limit ?, ?
        `;
        const params = [userId, userId, Number(page), Number(size)];
        const [rows] = await connection.query(query, params);

        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getCardHistory DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 추천 미션
exports.getRecommendedMission = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select m.missionId, distance, time, leaderId, nickname, timestampdiff(day, now(), endDate) + 1 as date
        from Mission m
                join UserMission um on m.missionId = um.missionId
                join User u on m.leaderId = u.userId
        where um.userId = ?
        and um.isDeleted = 'N'
        and u.isDeleted = 'N'
        and m.isDeleted = 'N'
        and um.complete = 'N';
        `;
        const params = [userId];
        const [rows] = await connection.query(query, params);

        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getRecommendedMission DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 달성한 미션
exports.getMissionHistory = async function (userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select distinct m.leaderId, nickname, v.missionCount
        from Mission m
                join UserMission um on m.missionId = um.missionId
                join User u on m.leaderId = u.userId
                join (select leaderId, count(um.missionId) as missionCount
                    from UserMission um
                                join Mission m on m.missionId = um.missionId
                    where um.userId = ?
                        and um.complete = 'Y'
                    group by leaderId) v on m.leaderId = v.leaderId
        where um.userId = ?
        and m.isDeleted = 'N'
        and um.isDeleted = 'N'
        and um.complete = 'Y';
        `;
        let params = [userId, userId];
        let [rows] = await connection.query(query, params);

        query = `
        select m.missionId, distance, time, pace, date_format(um.updatedAt, '%Y-%m-%d') as updatedAt
        from Mission m
                join UserMission um on m.missionId = um.missionId
                join User u on m.leaderId = u.userId
        where um.userId = ?
        and leaderId = ?
        and m.isDeleted = 'N'
        and um.isDeleted = 'N'
        and um.complete = 'Y'
        order by um.updatedAt desc;
        `
        
        for (var i = 0; i < rows.length; i++) {
            let leaderId = rows[i].leaderId;
            let params = [userId, leaderId];
            let [tmp] = await connection.query(query, params);

            rows[i].mission = tmp
        }

        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getMissionHistory DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
