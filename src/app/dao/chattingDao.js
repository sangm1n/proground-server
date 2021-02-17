const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 해당 챌린지 채팅 조회
 */
exports.getChatting = async function (userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        let query = `
        select distinct c.chattingId,
            ifnull(v.countChatting, 0) as more,
            u.userId,
            u.userName,
            u.profileImage,
            l.levelColor,
            c.message,
            c.image,
            date_format(c.createdAt, '%H:%i') as createdAt,
            w.chattingId               as commentId,
            w.userId                   as commentUserId,
            w.userName                 as commentUserName,
            w.profileImage                commentUserProfile,
            w.levelColor               as commentLevelColor,
            w.message                  as commentMessage,
            w.image                    as commentImage,
            date_format(w.createdAt, '%H:%i') as commentCreatedAt,
            c.createdAt as compareTime,
            'A' as status
        from User u
                join UserLevel ul on u.userId = ul.userId
                join Level l on ul.level = l.level
                join Chatting c on u.userId = c.userId
                join (select userId, chattingId, count(chattingId) - 1 as countChatting
                    from Chatting c
                    where challengeId = ?
                    group by parentChattingId) v
                    on c.chattingId = v.chattingId
                left join (select chattingId,
                                parentChattingId,
                                c.userId,
                                profileImage,
                                userName,
                                levelColor,
                                message,
                                image,
                                c.createdAt
                            from User u
                                    join UserLevel ul on u.userId = ul.userId
                                    join Level l on ul.level = l.level
                                    join Chatting c on u.userId = c.userId
                            where challengeId = ?
                            and u.isDeleted = 'N'
                            and c.isDeleted = 'N'
                            and c.chattingId != c.parentChattingId
                            group by parentChattingId) w on w.parentChattingId = c.chattingId
        where challengeId = ?
        and c.userId != ?
        and u.isDeleted = 'N'
        and c.isDeleted = 'N'
        order by c.parentChattingId, c.createdAt;
        `;
        let params = [challengeId, challengeId, challengeId, userId];
        const [firstRows] = await connection.query(query, params);

        query = `
        select distinct c.chattingId,
            ifnull(v.countChatting, 0) as more,
            u.userId,
            u.userName,
            u.profileImage,
            l.levelColor,
            c.message,
            c.image,
            date_format(c.createdAt, '%H:%i') as createdAt,
            w.chattingId               as commentId,
            w.userId                   as commentUserId,
            w.userName                 as commentUserName,
            w.profileImage                commentUserProfile,
            w.levelColor               as commentLevelColor,
            w.message                  as commentMessage,
            w.image                    as commentImage,
            date_format(w.createdAt, '%H:%i') as commentCreatedAt,
            c.createdAt as compareTime,
            'B' as status
        from User u
                join UserLevel ul on u.userId = ul.userId
                join Level l on ul.level = l.level
                join Chatting c on u.userId = c.userId
                join (select userId, chattingId, count(chattingId) - 1 as countChatting
                    from Chatting c
                    where challengeId = ?
                    group by parentChattingId) v
                    on c.chattingId = v.chattingId
                left join (select chattingId,
                                parentChattingId,
                                c.userId,
                                profileImage,
                                userName,
                                levelColor,
                                message,
                                image,
                                c.createdAt
                            from User u
                                    join UserLevel ul on u.userId = ul.userId
                                    join Level l on ul.level = l.level
                                    join Chatting c on u.userId = c.userId
                            where challengeId = ?
                            and u.isDeleted = 'N'
                            and c.isDeleted = 'N'
                            and c.chattingId != c.parentChattingId
                            group by parentChattingId) w on w.parentChattingId = c.chattingId
        where challengeId = ?
        and c.userId = ?
        and u.isDeleted = 'N'
        and c.isDeleted = 'N'
        order by c.parentChattingId, c.createdAt;
        `
        params = [challengeId, challengeId, challengeId, userId];
        const [secondRows] = await connection.query(query, params);

        query = `
        select distinct u.userId,
            userName,
            profileImage,
            levelColor,
            distance,
            date_format(endTime, '%Y.%m.%d %H:%i') as time,
            pace,
            ifnull(v.likeCount, 0) as likeCount,
            r.createdAt as compareTime,
            'C' as status
        from User u
                join UserLevel ul on u.userId = ul.userId
                join Level l on ul.level = l.level
                join Running r on u.userId = r.userId
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
        order by r.createdAt;
        `
        params = [challengeId];
        const [thirdRows] = await connection.query(query, params);

        connection.release();

        return [firstRows, secondRows, thirdRows];
    } catch (err) {
        logger.error(`App - checkChallengeChat DB Connection error\n: ${err.message}`);
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
                u.userName,
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
                    join (select c.userId, c.challengeId, chattingId, challengeTeam, challengeColor
                        from UserChallenge uc
                                    join Chatting c on uc.challengeId = c.challengeId
                        where challengeColor is not null
                        group by c.chattingId) v on c.chattingId = v.chattingId
            where parentChattingId = ?
            and u.isDeleted = 'N'
            and c.isDeleted = 'N'
            order by c.createdAt;
            `;
        } else {
            query = `
            select distinct c.chattingId,
                u.userId,
                u.userName,
                u.profileImage,
                l.levelColor,
                v.challengeTeam,
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
                    join (select c.userId, c.challengeId, chattingId, challengeTeam, challengeColor
                        from UserChallenge uc
                                    join Chatting c on uc.challengeId = c.challengeId
                        where challengeColor is not null
                        group by c.chattingId) v on c.chattingId = v.chattingId
            where parentChattingId = ?
            and u.isDeleted = 'N'
            and c.isDeleted = 'N'
            order by c.createdAt;
            `;
        }
        params = [chattingId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows;
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
exports.patchLastChatting = async function (chattingId, userId, challengeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        update UserChallenge set lastChattingId = ? where userId = ? and challengeId = ?;
        `;
        const params = [chattingId, userId, challengeId];
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
        const query = `
        select count(chattingId) as notReadChattingCount
        from Chatting
        where chattingId >
            (select lastChattingId from UserChallenge where userId = ? and challengeId = ? and lastChattingId != -1 and isDeleted = 'N')
        and chattingId = parentChattingId
        and isDeleted = 'N';
        `;
        const params = [userId, challengeId];
        const [rows] = await connection.query(
            query, params
        );
        connection.release();

        return rows[0]['notReadChattingCount'];
    } catch (err) {
        logger.error(`App - getNotReadChatting DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}