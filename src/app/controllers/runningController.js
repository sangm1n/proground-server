const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const jwt = require('jsonwebtoken');
const secret_config = require('../../../config/secret');

const runningDao = require('../dao/runningDao');

/***
 * update : 2021-02-15
 * 러닝 기록 저장 API
 */
exports.recordRunning = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    const {
        nonUserId, distance, startTime, endTime, pace, altitude, calorie
    } = req.body;

    if (token) token = jwt.verify(token, secret_config.jwtsecret);
    if (token === undefined & nonUserId === undefined) return res.json(response.successFalse(2506, "비회원 Id를 입력해주세요."));
    if (!distance) return res.json(response.successFalse(2500, "러닝 거리를 입력해주세요."));
    if (!startTime) return res.json(response.successFalse(2501, "러닝 시작 시간을 입력해주세요."));
    if (!endTime) return res.json(response.successFalse(2502, "러닝 종료 시간을 입력해주세요."));
    if (!pace) return res.json(response.successFalse(2503, "러닝 페이스를 입력해주세요."));
    if (!altitude) return res.json(response.successFalse(2504, "러닝 고도를 입력해주세요."));
    if (!calorie) return res.json(response.successFalse(2505, "러닝 소모 칼로리를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            await runningDao.postRunning(-1, -1, nonUserId, distance, startTime, endTime, pace, altitude, calorie);
            return res.json(response.successTrue(1501, "비회원 러닝 기록에 성공하였습니다."));
        // 회원
        } else {
            const userId = token.userId;
            const challengeRows = await runningDao.getUserChallenge(userId);
            
            if (challengeRows.length < 1) {
                await runningDao.postRunning(-1, userId, -1, distance, startTime, endTime, pace, altitude, calorie);
            } else {
                for (var i = 0; i < challengeRows.length; i++) {
                    let challengeId = challengeRows[i].challengeId;

                    await runningDao.postRunning(challengeId, userId, -1, distance, startTime, endTime, pace, altitude, calorie);
                }
            }
            return res.json(response.successTrue(1500, "회원 러닝 기록에 성공하였습니다."));
        }
    } catch (err) {
        logger.error(`App - recordRunning Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-15
 * 오늘 달린 회원 수 조회 API
 */
exports.countRunning = async function (req, res) {
    try {
        const countRows = await runningDao.getRunningCount();

        if (!countRows) return res.json(response.successFalse(3510, "오늘 달린 회원 수 조회에 실패하였습니다."));

        return res.json(response.successTrue(1510, "오늘 달린 회원 수 조회에 성공하였습니다.", countRows));
    } catch (err) {
        logger.error(`App - countRunning Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
