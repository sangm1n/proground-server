const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const jwt = require('jsonwebtoken');
const secret_config = require('../../../config/secret');

const runningDao = require('../dao/runningDao');
const challengeDao = require('../dao/challengeDao');
const chattingDao = require('../dao/chattingDao');
const notification = require('../../utils/notification');

/***
 * update : 2021-02-15
 * 러닝 기록 저장 API
 */
exports.recordRunning = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    const {
        nonUserId, distance, startTime, endTime, pace, altitude, calorie, section
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
            logger.info(`nonUserId ${nonUserId}번 러닝 기록 저장 완료`);

            if (section !== undefined) {
                const state = 'nonUserId = ' + nonUserId;
                const runningIdRows = await runningDao.getRunningId(state, distance, startTime, endTime, pace, altitude, calorie);

                for (var i = 0; i < runningIdRows.length; i++) {
                    let runningId = runningIdRows[i].runningId;
                    for (var j = 0; j < section.length; j++) {
                        let distance = parseFloat(j+1).toFixed(2);
                        let pace = parseFloat(section[j]).toFixed(2);
                        await runningDao.postRunningSection(runningId, distance, pace);
                    }
                }
                logger.info(`nonUserId ${nonUserId}번 구간 페이스 저장 완료`);
            }
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
            logger.info(`userId ${userId}번 러닝 기록 저장 완료`);
            
            if (section !== undefined) {
                const state = 'userId = ' + token.userId;
                const runningIdRows = await runningDao.getRunningId(state, distance, startTime, endTime, pace, altitude, calorie);

                for (var i = 0; i < runningIdRows.length; i++) {
                    let runningId = runningIdRows[i].runningId;
                    for (var j = 0; j < section.length; j++) {
                        let distance = parseFloat(j+1).toFixed(2);
                        let pace = parseFloat(section[j]).toFixed(2);
                        await runningDao.postRunningSection(runningId, distance, pace);
                    }
                }
            }
            logger.info(`userId ${userId}번 구간 페이스 저장 완료`);
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

/***
 * update : 2021-02-20
 * 러닝 기록 좋아요 API
 */
exports.likeRunning = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        runningId
    } = req.params;
    const {
        isLiked
    } = req.body;

    if (!runningId) return res.json(response.successFalse(2600, "러닝 번호를 입력해주세요."));
    if (!isLiked) return res.json(response.successFalse(2601, "좋아요 클릭 여부를 입력해주세요."));

    try {
        const checkRows = await runningDao.checkRunningId(runningId);
        if (checkRows === 0) return res.json(response.successFalse(3600, "존재하지 않는 러닝입니다."));

        const existRows = await runningDao.checkRunningLike(userId, runningId);
        // 새로 좋아요 테이블에 삽입
        if (existRows === 0) {
            await runningDao.insertRunningLike(userId, runningId);
        // 수정
        } else {
            await runningDao.patchRunningLike(isLiked, userId, runningId);
        }
        logger.info(`${runningId}번 러닝에 좋아요 클릭 완료`);

        const tmpRows = await runningDao.getFcmByRunningId(runningId);
        notification(`짝짝짝! 누군가 ${tmpRows.nickname} 님의 러닝을 응원🎉 했어요!`, '', tmpRows.fcmToken);

        const result = await runningDao.getLikeStatus(userId, runningId);

        return res.json(response.successTrue(1600, "러닝 좋아요 클릭에 성공하였습니다.", {likeStatus: result}));
    } catch (err) {
        logger.error(`App - likeRunning Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
