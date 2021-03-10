const response = require('../../utils/response');
const { pool } = require("../../../config/database");
const {logger} = require('../../../config/winston');

/***
 * 해당 챌린지 채팅 조회
 */
exports.getChatting = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select distinct c.chattingId,
                        uc.challengeTeamName,
                        ifnull(v.countChatting, 0)        as more,
                        u.userId,
                        u.nickname,
                        u.profileImage,
                        l.levelColor,
                        c.message,
                        c.image,
                        date_format(c.createdAt, '%H:%i') as createdAt,
                        w.chattingId                      as commentId,
                        w.userId                          as commentUserId,
                        w.nickname                        as commentUserNickname,
                        w.profileImage                       commentUserProfile,
                        w.challengeTeamName               as commentChallengeTeamName,
                        w.levelColor                      as commentLevelColor,
                        w.message                         as commentMessage,
                        w.image                           as commentImage,
                        date_format(w.createdAt, '%H:%i') as commentCreatedAt,
                        c.createdAt                       as compareTime,
                        'A'                               as status
        from User u
                join UserLevel ul on u.userId = ul.userId
                join Level l on ul.level = l.level
                join Chatting c on u.userId = c.userId
                join UserChallenge uc on c.challengeId = uc.challengeId and c.userId = uc.userId
                join (select userId, chattingId, if(count(chattingId) - 2 < 0, 0, count(chattingId) - 2) as countChatting
                    from Chatting c
                    where challengeId = ?
                    group by parentChattingId) v
                    on c.chattingId = v.chattingId
                left join (select chattingId,
                                parentChattingId,
                                c.userId,
                                profileImage,
                                challengeTeamName,
                                nickname,
                                levelColor,
                                message,
                                image,
                                c.createdAt
                            from User u
                                    join UserLevel ul on u.userId = ul.userId
                                    join Level l on ul.level = l.level
                                    join Chatting c on u.userId = c.userId
                                    join UserChallenge uc on u.userId = uc.userId
                            where uc.challengeId = ?
                            and u.isDeleted = 'N'
                            and c.isDeleted = 'N'
                            and c.chattingId != c.parentChattingId
                            group by parentChattingId) w on w.parentChattingId = c.chattingId
        where c.challengeId = ?
        and c.userId != ?
        and uc.isDeleted = 'N'
        and u.isDeleted = 'N'
        and c.isDeleted = 'N'
        order by c.parentChattingId desc, c.createdAt desc;
        `;
        let params = [challengeId, challengeId, challengeId, userId];
        const [firstRows] = await connection.query(query, params);
        logger.info(`챌린지 ${challengeId}번 - 나를 제외한 사용자 채팅 조회 완료`)

        query = `
        select distinct c.chattingId,
                        ifnull(v.countChatting, 0)        as more,
                        u.userId,
                        u.nickname,
                        u.profileImage,
                        l.levelColor,
                        c.message,
                        c.image,
                        date_format(c.createdAt, '%H:%i') as createdAt,
                        w.chattingId                      as commentId,
                        w.userId                          as commentUserId,
                        w.nickname                        as commentUserNickname,
                        w.profileImage                       commentUserProfile,
                        w.challengeTeamName               as commentChallengeTeamName,
                        w.levelColor                      as commentLevelColor,
                        w.message                         as commentMessage,
                        w.image                           as commentImage,
                        date_format(w.createdAt, '%H:%i') as commentCreatedAt,
                        c.createdAt                       as compareTime,
                        'B'                               as status
        from User u
                join UserLevel ul on u.userId = ul.userId
                join Level l on ul.level = l.level
                join Chatting c on u.userId = c.userId
                join (select userId, chattingId, if(count(chattingId) - 2 < 0, 0, count(chattingId) - 2) as countChatting
                    from Chatting c
                    where challengeId = ?
                    group by parentChattingId) v
                    on c.chattingId = v.chattingId
                left join (select chattingId,
                                parentChattingId,
                                c.userId,
                                profileImage,
                                challengeTeamName,
                                nickname,
                                levelColor,
                                message,
                                image,
                                c.createdAt
                            from User u
                                    join UserLevel ul on u.userId = ul.userId
                                    join Level l on ul.level = l.level
                                    join Chatting c on u.userId = c.userId
                                    join UserChallenge uc on u.userId = uc.userId
                            where uc.challengeId = ?
                            and u.isDeleted = 'N'
                            and c.isDeleted = 'N'
                            and c.chattingId != c.parentChattingId
                            group by parentChattingId) w on w.parentChattingId = c.chattingId
        where challengeId = ?
        and c.userId = ?
        and u.isDeleted = 'N'
        and c.isDeleted = 'N'
        order by c.parentChattingId desc, c.createdAt desc;
        `
        params = [challengeId, challengeId, challengeId, userId];
        const [secondRows] = await connection.query(query, params);
        logger.info(`챌린지 ${challengeId}번 - 내가 쓴 채팅 조회 완료`)

        query = `
        select distinct u.userId,
                        r.runningId,
                        nickname,
                        profileImage,
                        levelColor,
                        cast(distance as double) as distance,
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
                            end                                as time,
                        cast(pace as double) as pace,
                        ifnull(v.likeCount, 0)                 as likeCount,
                        ifnull(w.status, 'N')                  as likeStatus,
                        date_format(endTime, '%Y.%m.%d %H:%i') as endTime,
                        r.endTime                            as compareTime,
                        'C'                                    as status
        from User u
                join UserLevel ul on u.userId = ul.userId
                join Level l on ul.level = l.level
                join Running r on u.userId = r.userId
                left join (select runningId, status
                            from RunningLike rl
                                    join User u on rl.userId = u.userId
                            where rl.userId = ?) w on r.runningId = w.runningId
                left join (select r.runningId, count(likeId) as likeCount
                            from Running r
                                    join RunningLike rl on
                                r.runningId = rl.runningId
                            where rl.status = 'Y'
                            and r.isDeleted = 'N'
                            group by rl.runningId) v on v.runningId = r.runningId
        where u.isDeleted = 'N'
        and r.isDeleted = 'N'
        and challengeId = ?
        order by endTime desc;
        `
        params = [userId, challengeId];
        let [thirdRows] = await connection.query(query, params);
        logger.info(`챌린지 ${challengeId}번 - 러닝 기록 조회 완료`)

        query = `
        select challengeColor from UserChallenge where userId = ? and challengeId = ? and isDeleted = 'N';
        `
        if (thirdRows.length > 0) { 
            for (var i = 0; i < thirdRows.length; i++) {
                let userId = thirdRows[i].userId;
                params = [userId, challengeId];
                let [rows] = await connection.query(query, params);

                thirdRows[i].challengeColor = rows[0].challengeColor;
            }
        }

        connection.release();

        return [firstRows, secondRows, thirdRows];
    } catch (err) {
        logger.error(`App - getChatting DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

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

exports.postChatting = async function (challengeId, userId, message, image, parentChattingId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query, params;;
        if (!image) {
            query = `
            insert into Chatting (challengeId, userId, message)
            values (?, ?, ?);
            `;
            params = [challengeId, userId, message];
            await connection.query(query, params);
        } else {
            query = `
            insert into Chatting (challengeId, userId, message, image)
            values (?, ?, ?, ?);
            `;
            params = [challengeId, userId, message, image];
            await connection.query(query, params);
        }
        
        if (parentChattingId === undefined) {
            query = `
            select chattingId from Chatting order by createdAt desc limit 1;
            `
            const [rows] = await connection.query(query);
            const chattingId = rows[0].chattingId;
            
            query = `
            update Chatting set parentChattingId = ? where chattingId = ?;
            `
            params = [chattingId, chattingId];
            await connection.query(query, params);
        } else {
            query = `
            select chattingId from Chatting order by createdAt desc limit 1;
            `
            const [rows] = await connection.query(query);
            const chattingId = rows[0].chattingId;
            
            query = `
            update Chatting set parentChattingId = ? where chattingId = ?;
            `
            params = [parentChattingId, chattingId];
            await connection.query(query, params);
        }

        connection.release();
    } catch (err) {
        logger.error(`App - postChatting DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getChallengeId = async function (chattingId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select challengeId from Chatting where chattingId = ?;
        `;
        const params = [chattingId];
        const [rows] = await connection.query(query, params);

        connection.release();

        return rows[0]['challengeId'];
    } catch (err) {
        logger.error(`App - getChallengeId DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 개별 채팅 조회
exports.getEachChatting = async function (chattingId, challengeType) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        
        let query, params;
        if (challengeType === 'A') {
            query = `
            select distinct c.chattingId,
                u.userId,
                u.nickname,
                u.profileImage,
                l.levelColor,
                c.message,
                c.image,
                case
                    when c.createdAt < date_format(now(), '%Y-%m-%d 00:00:00')
                        then date_format(c.createdAt, '%m-%d %H:%i')
                    when c.createdAt >= date_format(now(), '%Y-%m-%d 00:00:00')
                        then date_format(c.createdAt, '%H:%i')
                    end as createdAt
            from User u
                    join UserLevel ul on u.userId = ul.userId
                    join Level l on ul.level = l.level
                    join Chatting c on u.userId = c.userId
                    join (select c.userId, c.challengeId, chattingId, challengeTeamName, challengeColor
                        from UserChallenge uc
                                    join Chatting c on uc.challengeId = c.challengeId
                        where challengeColor is not null
                        group by c.chattingId) v on c.chattingId = v.chattingId
            where parentChattingId = ? and c.chattingId = parentChattingId
            and u.isDeleted = 'N'
            and c.isDeleted = 'N'
            order by c.createdAt;
            `;
        } else {
            query = `
            select distinct c.chattingId,
                u.userId,
                u.nickname,
                u.profileImage,
                l.levelColor,
                v.challengeTeamName,
                v.challengeColor,
                c.message,
                c.image,
                case
                    when c.createdAt < date_format(now(), '%Y-%m-%d 00:00:00')
                        then date_format(c.createdAt, '%m-%d %H:%i')
                    when c.createdAt >= date_format(now(), '%Y-%m-%d 00:00:00')
                        then date_format(c.createdAt, '%H:%i')
                    end as createdAt
            from User u
                    join UserLevel ul on u.userId = ul.userId
                    join Level l on ul.level = l.level
                    join Chatting c on u.userId = c.userId
                    join (select c.userId, c.challengeId, chattingId, challengeTeamName, challengeColor
                        from UserChallenge uc
                                    join Chatting c on uc.challengeId = c.challengeId
                        where challengeColor is not null
                        group by c.chattingId) v on c.chattingId = v.chattingId
            where parentChattingId = ? and c.chattingId = parentChattingId
            and u.isDeleted = 'N'
            and c.isDeleted = 'N'
            order by c.createdAt;
            `;
        }
        params = [chattingId];
        const [parentChattingRows] = await connection.query(query, params);

        if (challengeType === 'A') {
            query = `
            select distinct c.chattingId,
                u.userId,
                u.nickname,
                u.profileImage,
                l.levelColor,
                c.message,
                c.image,
                case
                    when c.createdAt < date_format(now(), '%Y-%m-%d 00:00:00')
                        then date_format(c.createdAt, '%m-%d %H:%i')
                    when c.createdAt >= date_format(now(), '%Y-%m-%d 00:00:00')
                        then date_format(c.createdAt, '%H:%i')
                    end as createdAt
            from User u
                    join UserLevel ul on u.userId = ul.userId
                    join Level l on ul.level = l.level
                    join Chatting c on u.userId = c.userId
                    join (select c.userId, c.challengeId, chattingId, challengeTeamName, challengeColor
                        from UserChallenge uc
                                    join Chatting c on uc.challengeId = c.challengeId
                        where challengeColor is not null
                        group by c.chattingId) v on c.chattingId = v.chattingId
            where parentChattingId = ? and c.chattingId != parentChattingId
            and u.isDeleted = 'N'
            and c.isDeleted = 'N'
            order by c.createdAt;
            `;
        } else {
            query = `
            select distinct c.chattingId,
                u.userId,
                u.nickname,
                u.profileImage,
                l.levelColor,
                v.challengeTeamName,
                v.challengeColor,
                c.message,
                c.image,
                case
                    when c.createdAt < date_format(now(), '%Y-%m-%d 00:00:00')
                        then date_format(c.createdAt, '%m-%d %H:%i')
                    when c.createdAt >= date_format(now(), '%Y-%m-%d 00:00:00')
                        then date_format(c.createdAt, '%H:%i')
                    end as createdAt
            from User u
                    join UserLevel ul on u.userId = ul.userId
                    join Level l on ul.level = l.level
                    join Chatting c on u.userId = c.userId
                    join (select c.userId, c.challengeId, chattingId, challengeTeamName, challengeColor
                        from UserChallenge uc
                                    join Chatting c on uc.challengeId = c.challengeId
                        where challengeColor is not null
                        group by c.chattingId) v on c.chattingId = v.chattingId
            where parentChattingId = ? and c.chattingId != parentChattingId
            and u.isDeleted = 'N'
            and c.isDeleted = 'N'
            order by c.createdAt;
            `;
        }
        params = [chattingId];
        const [childChattingRows] = await connection.query(query, params);

        connection.release();

        return [parentChattingRows[0], childChattingRows];
    } catch (err) {
        logger.error(`App - getEachChatting DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 답글 생성
exports.checkChatting = async function (chattingId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select chattingId from Chatting where chattingId = ? and isDeleted = 'N') as exist;
        `;
        const params = [chattingId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkChatting DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 채팅 이미지 조회
exports.getChattingImage = async function (chattingId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select image from Chatting where chattingId = ? and isDeleted = 'N';
        `;
        const params = [chattingId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
        
        return rows[0];
    } catch (err) {
        logger.error(`App - getChattingImage DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 마지막 채팅
exports.patchLastChatting = async function (lastReadTime, userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update UserChallenge set lastReadTime = ? where userId = ? and challengeId = ? and isDeleted = 'N';
        `;
        const params = [lastReadTime, userId, challengeId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();
    } catch (err) {
        logger.error(`App - patchLastChatting DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 읽지 않은 채팅
exports.getNotReadChatting = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select count(chattingId) as notReadChattingCount
        from Chatting
        where createdAt > (select lastReadTime
                        from UserChallenge
                        where userId = ?
                            and challengeId = ?
                            and lastReadTime is not null
                            and isDeleted = 'N')
        and chattingId = parentChattingId
        and challengeId = ?
        and isDeleted = 'N';
        `;
        const params = [userId, challengeId, challengeId];
        const [firstRows] = await connection.query(query, params);

        query = `
        select count(runningId) as notReadRunningCount
        from Running
        where endTime > (select lastReadTime
                        from UserChallenge
                        where userId = ?
                        and challengeId = ?
                        and lastReadTime is not null
                        and isDeleted = 'N')
        and challengeId = ?
        and isDeleted = 'N';
        `
        const [secondRows] = await connection.query(query, params);

        const result = firstRows[0]['notReadChattingCount'] + secondRows[0]['notReadRunningCount'];
        connection.release();

        return result;
    } catch (err) {
        logger.error(`App - getNotReadChatting DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getFcmByChattingId = async function (chattingId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select nickname, fcmToken, isNotified
        from Chatting c join User u on c.userId = u.userId
        where chattingId = ?
        and c.isDeleted = 'N' and u.isDeleted = 'N';
        `;
        const params = [chattingId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getFcmByChattingId DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getUserIdByChattingId = async function (chattingId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select userId from Chatting where chattingId = ? and isDeleted = 'N';
        `;
        const params = [chattingId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getUserIdByChattingId DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 채팅 시간
 */
exports.getChattingTime = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select createdAt from Chatting where userId = ? and challengeId = ? order by createdAt desc limit 1;
        `;
        const params = [userId, challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['createdAt'];
    } catch (err) {
        logger.error(`App - getChattingTime DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getLastReadTime = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select lastReadTime from UserChallenge where userId = ? and challengeId = ? and isDeleted = 'N';
        `;
        const params = [userId, challengeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['lastReadTime'];
    } catch (err) {
        logger.error(`App - getLastReadTime DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
