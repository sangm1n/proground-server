const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const adminDao = require('../dao/adminDao');

/***
 * update : 2021-02-25
 * 리더 권한 부여 API
 */
exports.createLeader = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const nickname = req.body.nickname;

    if (!nickname) return res.json(response.successFalse(2000, "닉네임을 입력해주세요."));
    if (!req.file) return res.json(response.successFalse(2010, "프로필 이미지를 입력해주세요."));
    
    try {
        const checkRows = await adminDao.checkAdmin(userId);
        if (checkRows === 0) return res.json(response.successFalse(3000, "관리자가 아닙니다."));

        const profileImage = req.file.location;
        await adminDao.updateUserType(profileImage, nickname);
        logger.info(`${nickname}에게 리더 부여 완료`);
        return res.json(response.successTrue(1000, "특정 사용자에게 리더 권한을 부여하였습니다."));
    } catch (err) {
        logger.error(`App - createLeader Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-25
 * 챌린지 생성 API
 */
exports.createChallenge = async function (req, res) {
    const {

    } = req.body;

    try {
        

        return res.json(response.successTrue(1400, "전체 공지사항 조회에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - createChallenge Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
