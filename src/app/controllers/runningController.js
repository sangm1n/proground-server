const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const jwt = require('jsonwebtoken');
const secret_config = require('../../../config/secret');

const runningDao = require('../dao/runningDao');
const activityDao = require('../dao/activityDao');
const userDao = require('../dao/userDao');
const notification = require('../../utils/notification');

/***
 * update : 2021-02-15
 * 러닝 기록 저장 API
 */
exports.recordRunning = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    let {
        nonUserId, distance, startTime, endTime, pace, altitude, calorie, section, missionId
    } = req.body;

    if (token) token = jwt.verify(token, secret_config.jwtsecret);
    if (token === undefined && nonUserId === undefined) return res.json(response.successFalse(2506, "비회원 Id를 입력해주세요."));
    if (distance === undefined) return res.json(response.successFalse(2500, "러닝 거리를 입력해주세요."));
    if (!startTime) return res.json(response.successFalse(2501, "러닝 시작 시간을 입력해주세요."));
    if (!endTime) return res.json(response.successFalse(2502, "러닝 종료 시간을 입력해주세요."));
    if (pace === undefined) return res.json(response.successFalse(2503, "러닝 페이스를 입력해주세요."));
    if (altitude === undefined) return res.json(response.successFalse(2504, "러닝 고도를 입력해주세요."));
    if (calorie === undefined) return res.json(response.successFalse(2505, "러닝 소모 칼로리를 입력해주세요.")); 
    if (!req.file) return res.json(response.successFalse(2506, "프로필 이미지를 입력해주세요."));

    try {
        // 비회원
        if (token === undefined) {
            await runningDao.postRunning(-1, -1, nonUserId, distance, startTime, endTime, pace, altitude, calorie, req.file.location);
            logger.info(`nonUserId ${nonUserId}번 러닝 기록 저장 완료`);
            
            const state = 'nonUserId = ' + nonUserId;
            const runningIdRows = await runningDao.getRunningId(state, distance, startTime, endTime, pace, altitude, calorie);
            
            // 21.04.05 비회원 러닝 시 기록 저장 수정
            if (section !== undefined && section.length > 2) {
                const sectionSplit = section.slice(1, -1).split(',');
                for (var i = 0; i < runningIdRows.length; i++) {
                    let runningId = runningIdRows[i].runningId;
                    for (var j = 0; j < sectionSplit.length; j++) {
                        let distance = parseFloat(j+1).toFixed(2);
                        let pace = parseFloat(sectionSplit[j]).toFixed(2);
                        await runningDao.postRunningSection(runningId, distance, pace);
                    }
                }
                logger.info(`nonUserId ${nonUserId}번 구간 페이스 저장 완료`);
            }
            
            return res.json(response.successTrue(1501, "비회원 러닝 기록에 성공하였습니다.", { runningId: runningIdRows[0].runningId }));
        // 회원
        } else {
            const userId = token.userId;
            const challengeRows = await runningDao.getUserChallenge(userId);
            const userRows = await userDao.getUserProfile(userId);

            let state;
            let runningIdRows;

            if (userRows.userType === 'G') {
                if (challengeRows.length < 1) {
                    await runningDao.postRunning(-1, userId, -1, distance, startTime, endTime, pace, altitude, calorie, req.file.location);
                } else {
                    for (var i = 0; i < challengeRows.length; i++) {
                        let challengeId = challengeRows[i].challengeId;
    
                        await runningDao.postRunning(challengeId, userId, -1, distance, startTime, endTime, pace, altitude, calorie, req.file.location);
                    }
                }
                logger.info(`userId ${userId}번 러닝 기록 저장 완료`);

                state = 'userId = ' + token.userId;
                runningIdRows = await runningDao.getRunningId(state, distance, startTime, endTime, pace, altitude, calorie);
                
                if (section !== undefined && section.length > 2) {
                    const sectionSplit = section.slice(1, -1).split(',');
                    for (var i = 0; i < runningIdRows.length; i++) {
                        let runningId = runningIdRows[i].runningId;
                        for (var j = 0; j < sectionSplit.length; j++) {
                            let distance = parseFloat(j+1).toFixed(2);
                            let pace = parseFloat(sectionSplit[j]).toFixed(2);
                            await runningDao.postRunningSection(runningId, distance, pace);
                        }
                    }
                    logger.info(`userId ${userId}번 구간 페이스 저장 완료`);
                }
                let result;
                if (missionId) {
                    const timeDiff = (new Date(endTime) - new Date(startTime)) / 60000;
                    const missionRows = await runningDao.getMissionInfo(missionId);
                    if (distance >= missionRows.distance && timeDiff < missionRows.time) {
                        await runningDao.setMissionComplete(pace, userId, missionId);
                        mission = {
                            distance: missionRows.distance,
                            time: missionRows.time,
                            leader: missionRows.nickname
                        };
                        logger.info(`${missionId}번 미션 달성 !`);
    
                        result = {mission, runningId: runningIdRows[0].runningId};
                        
                        const state = 'userId = ' + userId;
                        const totalRows = await activityDao.getTotalRunning(state);
                        let currentLevel = await userDao.getUserLevel(userId);
                        currentLevel = currentLevel.level;
                        const countMission = await runningDao.countClearMission(userId);
                        let newLevel = 0;
    
                        for (var i = currentLevel + 1; i < 10; i++) {
                            let levelInfo = await runningDao.getMaxDistance(i);
                            if (levelInfo.maxDistance <= totalRows[0].totalDistance.slice(0, -2) &&
                            levelInfo.maxMission <= countMission) {
                                newLevel = i;
                            }
                        }
    
                        if (newLevel !== 0) {
                            await runningDao.updateUserLevel(newLevel, userId);
                            nextLevel = 'Lv. ' + (newLevel);
                            result = {mission, level: nextLevel, runningId: runningIdRows[0].runningId};
    
                            logger.info(`${userId}번 사용자 ${newLevel}로 레벨 업 !`);
                        }
                    } else {
                        result = {runningId: runningIdRows[0].runningId};
                    }
                } else {
                    const state = 'userId = ' + userId;
                    const totalRows = await activityDao.getTotalRunning(state);
                    let currentLevel = await userDao.getUserLevel(userId);
                    currentLevel = currentLevel.level;
                    const countMission = await runningDao.countClearMission(userId);
                    let newLevel = 0;
    
                    for (var i = currentLevel + 1; i < 10; i++) {
                        let levelInfo = await runningDao.getMaxDistance(i);
                        if (levelInfo.maxDistance <= totalRows[0].totalDistance.slice(0, -2) &&
                        levelInfo.maxMission <= countMission) {
                            newLevel = i;
                        }
                    }
    
                    if (newLevel !== 0) {
                        await runningDao.updateUserLevel(newLevel, userId);
                        result = {level: 'Lv. ' + (newLevel), runningId: runningIdRows[0].runningId};
    
                        logger.info(`${userId}번 사용자 ${newLevel}로 레벨 업 !`);
                    } else {
                        result = {runningId: runningIdRows[0].runningId};
                    }
                }
                return res.json(response.successTrue(1500, "회원 러닝 기록에 성공하였습니다.", result));
            }
            return res.json(response.successFalse(3500, "일반 유저가 뛴 러닝이 아닙니다."));
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
    let token = req.headers['x-access-token'] || req.query.token;
    let {
        nonUserId
    } = req.body;

    if (token) token = jwt.verify(token, secret_config.jwtsecret);
    if (token === undefined && nonUserId === undefined) return res.json(response.successFalse(2510, "비회원 Id를 입력해주세요."));

    try {
        const countRows = await runningDao.getRunningCount();
        const distRows = await runningDao.getTotalDistance();
        const calorieRows = await runningDao.getTotalCalorie();

        if (!distRows || !calorieRows) return res.json(response.successFalse(3510, "랜덤 문구 조회에 실패하였습니다."));

        const totalRows = [`프로그라운드에서\n어제 총 ${distRows.totalDistance}Km을 달렸습니다.`,
                            `프로그라운드에서\n어제 총 ${calorieRows.totalCalorie}Kcal을 태웠습니다!`,
                            `프로그라운드에서\n오늘 ${countRows}명이 달렸습니다.`];

        let userType;
        // 비회원
        if (token === undefined) {
            userType = 'G';
        } else {
            const userInfoRows = await userDao.getUserProfile(token.userId);
            userType = userInfoRows.userType;
        }

        const result = {
            randomState: totalRows[Math.floor(Math.random() * totalRows.length)],
            userType: userType
        }

        return res.json(response.successTrue(1510, "오늘 달린 회원 수 조회에 성공하였습니다.", result));
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

        const runningUserId = await runningDao.getUserIdByRunningId(runningId);
        const tmpRows = await runningDao.getFcmByRunningId(runningId);
        if (isLiked === 'Y' && runningUserId.userId !== userId && tmpRows.isNotified === 'Y' && tmpRows.isLogedIn === 'Y') {
            notification('[프로그라운드]', `짝짝짝! 누군가 ${tmpRows.nickname} 님의 러닝을 응원🎉 했어요!`, tmpRows.fcmToken);
        }

        const result = await runningDao.getLikeStatus(userId, runningId);

        return res.json(response.successTrue(1600, "러닝 좋아요 클릭에 성공하였습니다.", {likeStatus: result}));
    } catch (err) {
        logger.error(`App - likeRunning Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-03-19
 * 러닝 페이지 조회 API
 */
exports.runningPage = async function (req, res) {
    let token = req.headers['x-access-token'] || req.query.token;
    if (token) token = jwt.verify(token, secret_config.jwtsecret);

    const {
        runningId
    } = req.params;
    
    if (!runningId) return res.json(response.successFalse(2600, "러닝 번호를 입력해주세요."));

    try {
        const checkRows = await runningDao.checkRunningId(runningId);
        if (checkRows === 0) return res.json(response.successFalse(3600, "존재하지 않는 러닝입니다."));

        const result = await runningDao.getRunningPage(runningId);

        return res.json(response.successTrue(1000, "러닝 페이지 조회에 성공하였습니다.", result));
    } catch (err) {
        logger.error(`App - runningPage Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
