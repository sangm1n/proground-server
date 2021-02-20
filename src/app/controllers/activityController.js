const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const jwt = require('jsonwebtoken');
const secret_config = require('../../../config/secret');

const activityDao = require('../dao/activityDao');
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
    } = req.body;

    if (token === undefined & !nonUserId) return res.json(response.successFalse(2700, "비회원 Id를 입력해주세요."));

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

            const result = {
                weekly: {
                    totalDistance: recentRows[0].totalDistance,
                    runningGraph: recentRows[1]
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
    } = req.body;

    if (token === undefined & !nonUserId) return res.json(response.successFalse(2700, "비회원 Id를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            const state = "nonUserId = " + nonUserId;
            const historyRows = await activityDao.getRunningHistory(state);
            
            return res.json(response.successTrue(1711, "비회원 러닝 기록 조회에 성공하였습니다.", historyRows));
        // 회원
        } else {
            const userId = token.userId;
            const state = "userId = " + userId;
            const historyRows = await activityDao.getRunningHistory(state);
            
            return res.json(response.successTrue(1710, "회원 러닝 기록 조회에 성공하였습니다.", historyRows));
        }
    } catch (err) {
        logger.error(`App - runningHistory Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
