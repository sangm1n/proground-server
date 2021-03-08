const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const chattingDao = require('../dao/chattingDao');
const challengeDao = require('../dao/challengeDao');

const s3 = require('../../utils/awsS3');
const multer = require('multer');
const notification = require('../../utils/notification');

/***
 * update : 2021-02-10
 * 해당 챌린지 채팅 조회 API
 */
exports.allChatting = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {challengeId} = req.params;
    let {
        page, size
    } = req.query;

    if (!page) return res.json(response.successFalse(2060, "페이지를 입력해주세요."));
    if (!size) return res.json(response.successFalse(2070, "사이즈를 입력해주세요."));
    if (page < 1) return res.json(response.successFalse(2061, "페이지 번호를 확인해주세요."));
    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));

    try {
        page = size * (page - 1);
        size = Number(page) + Number(size);

        const challengeRows = await challengeDao.checkChallenge(challengeId);
        const checkRows = await challengeDao.checkRegisterChallenge(userId, challengeId);

        if (challengeRows === 0) return res.json(response.successFalse(3100, "존재하지 않는 챌린지입니다."));
        if (checkRows === 0) return res.json(response.successFalse(3101, "현재 참가중인 챌린지가 아닙니다."));

        const chattingRows = await chattingDao.getChatting(userId, challengeId);

        const first = chattingRows[0];
        const second = chattingRows[1];
        const third = chattingRows[2];

        const chatting = [...first, ...second, ...third];

        chatting.sort(function (a, b) { return b.compareTime - a.compareTime });
        const resultRows = chatting.slice(page, size);

        if (resultRows.length > 1) {
            const lastReadTime = new Date();
            await chattingDao.patchLastChatting(lastReadTime, userId, challengeId);
            logger.info(`${challengeId}번 챌린지 채팅 조회 - ${lastReadTime}`)
        }
        if (resultRows.length === 0) return res.json(response.successTrue(1350, "아직 채팅 내용이 없습니다."));

        return res.json(response.successTrue(1300, "해당 챌린지 채팅 조회에 성공하였습니다.", resultRows));
    } catch (err) {
        logger.error(`App - allChatting Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-10
 * 해당 챌린지 채팅 생성 API
 */
exports.makeChatting = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {challengeId} = req.params;
    let message = req.body.message;
    if ((message === undefined || (message !== undefined && message.trim().length === 0)) && req.file === undefined) return res.json(response.successFalse(2200, "채팅을 입력해주세요.")); 
    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));

    try {
        const challengeRows = await challengeDao.checkChallenge(challengeId);
        const checkRows = await chattingDao.checkChallengeChat(userId, challengeId);

        if (challengeRows === 0) return res.json(response.successFalse(3100, "존재하지 않는 챌린지입니다."));
        if (checkRows === 0) return res.json(response.successFalse(3101, "현재 참가중인 챌린지가 아닙니다."));

        if (req.file === undefined) await chattingDao.postChatting(challengeId, userId, message);
        else await chattingDao.postChatting(challengeId, userId, null, req.file.location);

        const lastReadTime = await chattingDao.getLastReadTime(userId, challengeId);
        const lastChatTime = await chattingDao.getChattingTime(userId, challengeId);

        const chattingRows = await chattingDao.getChatting(userId, challengeId);

        const first = chattingRows[0];
        const second = chattingRows[1];
        const third = chattingRows[2];

        const chatting = [...first, ...second, ...third];

        chatting.sort(function (a, b) { return b.compareTime - a.compareTime });
        let value = 0;
        for (var i = 0; i < chatting.length; i++) {
            if (lastReadTime <= chatting[i].compareTime && chatting[i].compareTime <= lastChatTime) {
                value = i;
            } else break;
        }
        const limitRows = chatting.slice(0, value + 1);
        const resultRows = limitRows.reverse();

        return res.json(response.successTrue(1310, "해당 챌린지 채팅 생성에 성공하였습니다.", resultRows));
    } catch (err) {
        logger.error(`App - makeChatting Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-11
 * 개별 채팅 조회 API
 */
exports.eachChatting = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {chattingId} = req.params;
    if (!chattingId) return res.json(response.successFalse(2200, "채팅 번호를 입력해주세요."));

    try {
        const challengeId = await chattingDao.getChallengeId(chattingId);
        const challengeType = await challengeDao.getChallengeType(challengeId);
        const chattingRows = await chattingDao.getEachChatting(chattingId, challengeType);
        logger.info(`채팅 ${chattingId}번 - 개별 채팅 조회 완료`);

        result = {
            chatting: chattingRows[0],
            comments: chattingRows[1]
        }

        if (chattingRows[1].length < 1) return res.json(response.successTrue(1320, "채팅 대댓글이 아직 존재하지 않습니다.", {chatting: chattingRows[0]}));
        else return res.json(response.successTrue(1310, "채팅 조회에 성공하였습니다.", result));
    } catch (err) {
        logger.error(`App - eachChatting Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-11
 * 채팅 답글 생성 API
 */
exports.makeComment = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {chattingId} = req.params;
    let message = req.body.message;

    if ((message === undefined || (message !== undefined && message.trim().length === 0)) && req.file === undefined) return res.json(response.successFalse(2200, "채팅을 입력해주세요.")); 
    if (!chattingId) return res.json(response.successFalse(2100, "채팅 번호를 입력해주세요."));

    try {
        const checkRows = await chattingDao.checkChatting(chattingId);
        if (checkRows === 0) return res.json(response.successFalse(3100, "존재하지 않는 채팅입니다."));

        const challengeId = await chattingDao.getChallengeId(chattingId);
        const chattingUserId = await chattingDao.getUserIdByChattingId(chattingId);

        if (req.file === undefined) await chattingDao.postChatting(challengeId, userId, message, null, chattingId);
        else await chattingDao.postChatting(challengeId, userId, null, req.file.location, chattingId);

        if (chattingUserId.userId !== userId) {
            const tmpRows = await chattingDao.getFcmByChattingId(chattingId);
            notification('[프로그라운드]', `똑똑! ${tmpRows.nickname} 님의 채팅에 댓글💬 이 달렸어요!`, tmpRows.fcmToken);
        }
        
        const challengeType = await challengeDao.getChallengeType(challengeId);
        const chattingRows = await chattingDao.getEachChatting(chattingId, challengeType);
        logger.info(`채팅 ${chattingId}번 - 개별 채팅 조회 완료`);

        result = {
            chatting: chattingRows[0],
            comments: chattingRows[1]
        };

        return res.json(response.successTrue(1320, "채팅 답글 생성에 성공하였습니다.", result));
    } catch (err) {
        logger.error(`App - makeComment Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-12
 * 채팅 이미지 조회 API
 */
exports.chattingImage = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {chattingId} = req.params;
    
    if (!chattingId) return res.json(response.successFalse(2100, "채팅 번호를 입력해주세요."));

    try {
        const imageRows = await chattingDao.getChattingImage(chattingId);

        if (imageRows.image === null) return res.json(response.successTrue(3300, "채팅 이미지가 존재하지 않습니다."));

        return res.json(response.successTrue(1340, "채팅 이미지 조회에 성공하였습니다.", imageRows));
    } catch (err) {
        logger.error(`App - chattingImage Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
};
