const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const noticeDao = require('../dao/noticeDao');

/***
 * update : 2021-02-14
 * 전체 공지사항 조회 API
 */
exports.allNotices = async function (req, res) {
    let {
        page, size
    } = req.query;

    if (!page) return res.json(response.successFalse(2060, "페이지를 입력해주세요."));
    if (!size) return res.json(response.successFalse(2070, "사이즈를 입력해주세요."));
    if (page < 1) return res.json(response.successFalse(2061, "페이지 번호를 확인해주세요."));

    try {
        page = size * (page - 1);
        
        const noticeRows = await noticeDao.getAllNotices(page, size);

        return res.json(response.successTrue(1400, "전체 공지사항 조회에 성공하였습니다.", noticeRows));
    } catch (err) {
        logger.error(`App - allNotices Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-14
 * 개별 공지사항 조회 API
 */
exports.noticeInfo = async function (req, res) {
    const {
        noticeId
    } = req.params;

    if (!noticeId) return res.json(response.successFalse(2400, "공지 번호를 입력해주세요."));

    try {       
        const checkRows = await noticeDao.checkNotice(noticeId);
        if (checkRows === 0) return res.json(response.successFalse(3400, "존재하지 않는 공지사항입니다."));
        
        const noticeRows = await noticeDao.getNotice(noticeId);

        return res.json(response.successTrue(1401, "개별 공지사항 조회에 성공하였습니다.", noticeRows));
    } catch (err) {
        logger.error(`App - allNotices Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
