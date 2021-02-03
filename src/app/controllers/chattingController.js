const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const chattingDao = require('../dao/chattingDao');
const challengeDao = require('../dao/challengeDao');

/***
 * update : 2021-01-31
 * 해당 챌린지 채팅 조회 API
 */
exports.allChatting = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {challengeId} = req.params;
    let {
        paze, size
    } = req.query;

    if (!page) return res.json(response.successFalse(2060, "페이지를 입력해주세요."));
    if (!size) return res.json(response.successFalse(2070, "사이즈를 입력해주세요."));
    if (page < 1) return res.json(response.successFalse(2061, "페이지 번호를 확인해주세요."));
    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));

    try {
        page = size * (page - 1);

        const challengeRows = await challengeDao.checkChallenge(challengeId);
        const checkRows = await chattingDao.checkChallengeChat(userId, challengeId);

        if (challengeRows === 0) return res.json(response.successFalse(3100, "존재하지 않는 챌린지입니다."));
        if (checkRows === 0) return res.json(response.successFalse(3101, "현재 참가중인 챌린지가 아닙니다."));

        

        return res.json(response.successTrue(1050, "채팅 조회에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - allChatting Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-31
 * 해당 챌린지 채팅 생성 API
 */
exports.makeChatting = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {challengeId} = req.params;
    const {
        message, image
    } = req.body;
    
    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));
    if (!message) return res.json(response.successFalse(2200, "채팅 메시지를 입력해주세요."));

    try {
        const challengeRows = await challengeDao.checkChallenge(challengeId);
        const checkRows = await chattingDao.checkChallengeChat(userId, challengeId);

        if (challengeRows === 0) return res.json(response.successFalse(3100, "존재하지 않는 챌린지입니다."));
        if (checkRows === 0) return res.json(response.successFalse(3101, "현재 참가중인 챌린지가 아닙니다."));

        await chattingDao.postChatting(challengeId, userId, message, image);

        return res.json(response.successTrue(1040, "채팅 메시지 입력에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - makeChatting Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
