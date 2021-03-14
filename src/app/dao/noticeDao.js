const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 전체 공지사항 조회
 */
exports.getAllNotices = async function (userId, status) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select noticeId, title, content, banner, date_format(createdAt, '%Y-%m-%d') as createdAt
        from Notice
        where isDeleted = 'N'
        order by createdAt;
        `;
        let [rows] = await connection.query(query);

        const find = `
        select exists (select userId from UserNotice where userId = ? and noticeId = ? and isSignedUp = ?) as exist;
        `;
        for (var i = 0; i < rows.length; i++) {
            let noticeId = rows[i].noticeId;
            let params = [userId, noticeId, status];

            let [check] = await connection.query(find, params);
            
            if (check[0].exist === 0) rows[i].isRead = 'N';
            else rows[i].isRead = 'Y';
        }
        connection.release();

        return rows;
    } catch (err) {
        logger.error(`App - getAllNotices DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

/***
 * 개별 공지사항 조회
 */
exports.checkNotice = async function (noticeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select exists(select noticeId from Notice where noticeId = ? and isDeleted = 'N') as exist;
        `;
        const params = [noticeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0]['exist'];
    } catch (err) {
        logger.error(`App - checkNotice DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getNotice = async function (noticeId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select title, content, image, date_format(createdAt, '%Y-%m-%d') as createdAt
        from Notice
        where isDeleted = 'N'
        and noticeId = ?;
        `;
        const params = [noticeId];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - getNotice DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

// 개별 공지사항 읽었을 때 UserNotice 테이블에 넣어주기
exports.postUserNotice = async function (userId, noticeId, isSignedUp) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        insert into UserNotice (userId, noticeId, isSignedUp) select ?, ?, ? from dual
        where not exists (select userId, noticeId, isSignedUp from UserNotice where userId = ? and noticeId = ? and isSignedUp = ?);
        `;
        const params = [userId, noticeId, isSignedUp, userId, noticeId, isSignedUp];
        const [rows] = await connection.query(query, params);
        connection.release();

        return rows[0];
    } catch (err) {
        logger.error(`App - postUserNotice DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}

exports.getNoticeCount = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select count(noticeId) as noticeCount from Notice where isDeleted = 'N';
        `;
        const [rows] = await connection.query(query);
        connection.release();

        return rows[0]['noticeCount'];
    } catch (err) {
        logger.error(`App - getNoticeCount DB Connection error\n: ${err.message}`);
        return res.json(response.successFalse(4001, "데이터베이스 연결에 실패하였습니다."));
    }
}
