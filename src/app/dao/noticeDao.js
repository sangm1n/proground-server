const response = require('../../utils/response');
const { pool } = require("../../../config/database");

/***
 * 전체 공지사항 조회
 */
exports.getAllNotices = async function (page, size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const query = `
        select noticeId, title, content, date_format(createdAt, '%Y-%m-%d') as createdAt
        from Notice
        where isDeleted = 'N'
        order by createdAt
        limit ` + page + `, ` + size + `;
        `;
        const params = [page, size];
        const [rows] = await connection.query(query, params);
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
