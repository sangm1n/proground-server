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
        order by createdAt desc;
        `;
        const [rows] = await connection.query(query);

        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getRunningHistory DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}