const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const challengeDao = require('../dao/challengeDao');

/***
 * update : 2021-01-29
 * 전체 챌린지 조회 API
 */
exports.allChallenges = async function (req, res) {
    let {
        page, size
    } = req.query;

    if (!page) return res.json(response.successFalse(2060, "페이지를 입력해주세요."));
    if (!size) return res.json(response.successFalse(2070, "사이즈를 입력해주세요."));
    if (page < 1) return res.json(response.successFalse(2061, "페이지 번호를 확인해주세요."));

    try {
        page = size * (page - 1);
        const challengeRows = await challengeDao.getAllChallenges(page, size);

        if (challengeRows.length === 0) return res.json(response.successTrue(1033, "참여중인 챌린지가 없습니다."));

        return res.json(response.successTrue(1020, "챌린지 조회에 성공하였습니다.", challengeRows));
    } catch (err) {
        logger.error(`App - allChallenges Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-30
 * My 챌린지 조회 API -> 안읽은 채팅 개수 가져오는거 추가해야함
 */
exports.myChallenge = async function (req, res) {
    const userId = req.verifiedToken.userId;
    let {
        page, size
    } = req.query;

    if (!page) return res.json(response.successFalse(2060, "페이지를 입력해주세요."));
    if (!size) return res.json(response.successFalse(2070, "사이즈를 입력해주세요."));
    if (page < 1) return res.json(response.successFalse(2061, "페이지 번호를 확인해주세요."));

    try {
        page = size * (page - 1);
        const challengeRows = await challengeDao.getMyChallenge(userId, page, size);

        if (challengeRows.length === 0) return res.json(response.successTrue(1033, "참여중인 챌린지가 없습니다."));

        return res.json(response.successTrue(1020, "챌린지 조회에 성공하였습니다.", challengeRows));
    } catch (err) {
        logger.error(`App - myChallenge Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-30
 * 개별 챌린지 조회 API
 */
exports.challengeInfo = async function (req, res) {
    const {
        challengeId
    } = req.params;
    
    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));

    try {
        const checkRows = await challengeDao.checkChallenge(challengeId);
        if (checkRows === 0) return res.json(response.successFalse(3100, "존재하지 않는 챌린지입니다."));

        const challengeRows = await challengeDao.getChallenge(challengeId);
        const leaderRows = await challengeDao.getLeader(challengeId);
        const cardRows = await challengeDao.getCard(challengeId);
        const colorRows = await challengeDao.getColor(challengeId);

        const result = {
            challenge: challengeRows,
            leader: leaderRows,
            card: cardRows,
            color: colorRows
        }

        return res.json(response.successTrue(1020, "챌린지 조회에 성공하였습니다.", result));
    } catch (err) {
        logger.error(`App - challengeInfo Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-30
 * 챌린지 참가 API
 */
exports.registerChallenge = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {challengeId} = req.params;
    const {challengeColor} = req.body;
    
    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));
    if (!challengeColor) return res.json(response.successFalse(2101, "챌린지 색상을 입력해주세요"));

    try {
        const checkRows = await challengeDao.checkChallenge(challengeId);
        if (checkRows === 0) return res.json(response.successFalse(3100, "존재하지 않는 챌린지입니다."));
        
        const checkRegRows = await challengeDao.checkRegisterChallenge(userId, challengeId);
        if (checkRegRows === 1) return res.json(response.successFalse(3101, "이미 참가한 챌린지입니다."));

        await challengeDao.postChallenge(userId, challengeId, challengeColor);
        return res.json(response.successTrue(1030, "챌린지 참가에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - registerChallenge Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-30
 * 챌린지 탈퇴 API
 */
exports.outChallenge = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {challengeId} = req.params;
    
    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));

    try {
        const checkRows = await challengeDao.checkRegisterChallenge(userId, challengeId);
        if (checkRows === 0) return res.json(response.successFalse(3102, "이미 탈퇴한 챌린지입니다."));

        await challengeDao.withdrawChallenge(userId, challengeId);
        return res.json(response.successTrue(1031, "챌린지 탈퇴에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - outChallenge Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
