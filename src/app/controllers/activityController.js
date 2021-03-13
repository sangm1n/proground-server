const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const jwt = require('jsonwebtoken');
const secret_config = require('../../../config/secret');

const activityDao = require('../dao/activityDao');
const runningDao = require('../dao/runningDao');
const userDao = require('../dao/userDao');
let maxValue = 10;

/***
 * update : 2021-02-19
 * 러닝 통계 조회 API
 */
exports.runningStatistic = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    if (token) token = jwt.verify(token, secret_config.jwtsecret);

    const {
        nonUserId
    } = req.params;

    if (token === undefined & nonUserId == 0) return res.json(response.successFalse(2700, "비회원 Id를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            const state = "nonUserId = " + nonUserId;
            const recentRows = await activityDao.getRecentRunning(state, maxValue);
            const totalRows = await activityDao.getTotalRunning(state);

            const result = {
                weekly: {
                    totalDistance: recentRows[0].totalDistance,
                    runningGraph: recentRows[1]
                },
                total: totalRows[0]
            }
            
            return res.json(response.successTrue(1701, "비회원 최근 7일 러닝 통계 조회에 성공하였습니다.", result));
        // 회원
        } else {
            const userId = token.userId;
            const state = "userId = " + userId;
            const recentRows = await activityDao.getRecentRunning(state, maxValue);
            const totalRows = await activityDao.getTotalRunning(state);
            const randomRows = await activityDao.getRandomStatement();

            const currentLevel = await userDao.getUserLevel(userId);  
            const countMission = await runningDao.countClearMission(userId);
            const levelLimit = await runningDao.getMaxDistance(currentLevel.level + 1);

            let X, Y;
            if (levelLimit.maxDistance - parseFloat(totalRows[0].totalDistance.slice(0, -2), 2) < 0) X = 0;
            else X = (levelLimit.maxDistance - parseFloat(totalRows[0].totalDistance.slice(0, -2), 2)).toFixed(2);
            if (levelLimit.maxMission - countMission < 0) Y = 0;
            else Y = levelLimit.maxMission - countMission;

            let sentence;
            if (levelLimit > 5) sentence = '';
            else sentence = `다음 레벨까지 ${X}km와 미션 ${Y}개 남았어요!`;

            const result = {
                weekly: {
                    totalDistance: recentRows[0].totalDistance,
                    runningGraph: recentRows[1],
                    randomSentence: randomRows[Math.floor(Math.random() * randomRows.length)].text,
                    staticSentence: sentence
                },
                total: totalRows[0]
            }
            
            return res.json(response.successTrue(1700, "회원 최근 7일 러닝 통계 조회에 성공하였습니다.", result));
        }
    } catch (err) {
        logger.error(`App - runningStatistic Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-20
 * 러닝 기록 조회 API
 */
exports.runningHistory = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    if (token) token = jwt.verify(token, secret_config.jwtsecret);

    const {
        nonUserId
    } = req.params;

    if (token === undefined & nonUserId == 0) return res.json(response.successFalse(2700, "비회원 Id를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            const state = "nonUserId = " + nonUserId;
            const historyRows = await activityDao.getRunningHistory(state);

            if (historyRows.length < 1) return res.json(response.successTrue(1712, "아직 러닝 기록이 없습니다."));
            return res.json(response.successTrue(1711, "비회원 러닝 기록 조회에 성공하였습니다.", historyRows));
        // 회원
        } else {
            const userId = token.userId;
            const state = "userId = " + userId;
            const historyRows = await activityDao.getRunningHistory(state);
            
            if (historyRows.length < 1) return res.json(response.successTrue(1712, "아직 러닝 기록이 없습니다."));
            return res.json(response.successTrue(1710, "회원 러닝 기록 조회에 성공하였습니다.", historyRows));
        }
    } catch (err) {
        logger.error(`App - runningHistory Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-20
 * 획득한 카드 조회 API
 */
exports.cardHistory = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    if (token) token = jwt.verify(token, secret_config.jwtsecret);

    const {
        nonUserId
    } = req.params;

    if (token === undefined & nonUserId == 0) return res.json(response.successFalse(2700, "비회원 Id를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            return res.json(response.successTrue(1721, "아직 받은 카드가 없습니다."));
        // 회원
        } else {
            const userId = token.userId;
            const historyRows = await activityDao.getCardHistory(userId);
            
            if (historyRows.length < 1) return res.json(response.successTrue(1721, "아직 받은 카드가 없습니다."));
            return res.json(response.successTrue(1720, "받은 카드 조회에 성공하였습니다.", historyRows));
        }
    } catch (err) {
        logger.error(`App - cardHistory Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-20
 * 완료한 챌린지 조회 API
 */
exports.challengeHistory = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    if (token) token = jwt.verify(token, secret_config.jwtsecret);

    const {
        nonUserId
    } = req.params;

    if (token === undefined & nonUserId == 0) return res.json(response.successFalse(2700, "비회원 Id를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            return res.json(response.successTrue(1731, "아직 달성한 챌린지가 없습니다."));
        // 회원
        } else {
            const userId = token.userId;
            const historyRows = await activityDao.getChallengeHistory(userId);
            
            if (historyRows.length < 1) return res.json(response.successTrue(1731, "아직 달성한 챌린지가 없습니다."));
            return res.json(response.successTrue(1730, "달성한 챌린지 조회에 성공하였습니다.", historyRows));
        }
    } catch (err) {
        logger.error(`App - challengeHistory Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-20
 * 추천 미션 조회 API
 */
exports.missionToDo = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    if (token) token = jwt.verify(token, secret_config.jwtsecret);

    const {
        nonUserId
    } = req.params;

    if (token === undefined & nonUserId == 0) return res.json(response.successFalse(2700, "비회원 Id를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            return res.json(response.successTrue(1741, "아직 추천된 미션이 없습니다."));
        // 회원
        } else {
            const userId = token.userId;
            const historyRows = await activityDao.getRecommendedMission(userId);
            
            if (historyRows.length < 1) return res.json(response.successTrue(1741, "아직 추천된 미션이 없습니다."));
            return res.json(response.successTrue(1740, "추천 미션 조회에 성공하였습니다.", historyRows));
        }
    } catch (err) {
        logger.error(`App - missionToDo Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-20
 * 달성한 미션 조회 API
 */
exports.missionHistory = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    if (token) token = jwt.verify(token, secret_config.jwtsecret);

    const {
        nonUserId
    } = req.params;

    if (token === undefined & nonUserId == 0) return res.json(response.successFalse(2700, "비회원 Id를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            return res.json(response.successTrue(1751, "아직 달성한 미션이 없습니다."));
        // 회원
        } else {
            const userId = token.userId;
            const historyRows = await activityDao.getMissionHistory(userId);
            
            if (historyRows.length < 1) return res.json(response.successTrue(1751, "아직 달성한 미션이 없습니다."));
            return res.json(response.successTrue(1750, "달성한 미션 조회에 성공하였습니다.", historyRows));
        }
    } catch (err) {
        logger.error(`App - missionHistory Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
