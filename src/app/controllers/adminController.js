const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const challengeDao = require('../dao/challengeDao');
const activityDao = require('../dao/activityDao');
const runningDao = require('../dao/runningDao');
const adminDao = require('../dao/adminDao');
const userDao = require('../dao/userDao');

const notification = require('../../utils/notification');
const s3 = require('../../utils/awsS3');
const { userLevel } = require('./userController');
const { level } = require('winston');

/***
 * update : 2021-02-25
 * 리더 권한 부여 API
 */
exports.createLeader = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const uuserId = req.body.userId;
    const introduction = req.body.introduction;

    if (!uuserId || uuserId.length < 1) return res.json(response.successFalse(2000, "userId를 입력해주세요."));
    if (!req.file) return res.json(response.successFalse(2010, "프로필 이미지를 입력해주세요."));
    if (!introduction || introduction.length < 1) return res.json(response.successFalse(2020, "리더 소개를 입력해주세요."));
    
    try {
        const checkRows = await adminDao.checkAdmin(userId);
        if (checkRows === 0) return res.json(response.successFalse(3000, "관리자가 아닙니다."));

        const userCheckRows = await userDao.checkUserId(uuserId);
        if (userCheckRows === 0) return res.json(response.successFalse(3010, "존재하지 않는 사용자입니다."));

        const profileImage = req.file.location;
        await adminDao.updateUserType(profileImage, uuserId, introduction);
        logger.info(`${uuserId}번 사용자에게 리더 부여 완료`);
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
    const userId = req.verifiedToken.userId;
    let {
        challengeName, introduction, challengeType, distance, personnel, minLevel, maxLevel, startDate, endDate, firstColor, firstTeamName, secondColor, secondTeamName, cardId
    } = req.body;
    
    if (req.file === undefined) return res.json(response.successFalse(2000, "챌린지 이미지를 입력해주세요."));
    if (!challengeName || challengeName.length < 1) return res.json(response.successFalse(2010, "챌린지 이름을 입력해주세요."));
    if (!introduction || introduction.length < 1) return res.json(response.successFalse(2020, "챌린지 소개를 입력해주세요."));
    if (!challengeType || challengeType.length < 1) return res.json(response.successFalse(2030, "챌린지 타입을 입력해주세요."));
    if (!distance || distasnce.length < 1) return res.json(response.successFalse(2040, "챌린지 목표 거리를 입력해주세요."));
    if (!personnel || personnel.length < 1) return res.json(response.successFalse(2050, "챌린지 수용 인원를 입력해주세요."));
    if (!minLevel || !maxLevel || minLevel.length < 1 || maxLevel.length < 1) return res.json(response.successFalse(2060, "챌린지 레벨 범위를 올바르게 입력해주세요."));
    if (!startDate || !endDate || startDate.length < 1 || endDate.length < 1) return res.json(response.successFalse(2070, "챌린지 날짜 범위를 올바르게 입력해주세요."));
    if (challengeType === 'B' && personnel % 2 !== 0) return res.json(response.successFalse(2110, "경쟁전 수용인원은 반드시 짝수로 입력해주세요."));

    // A: 목표달성, B: 경쟁전
    if ((!firstColor || firstColor.length < 1) && (!firstTeamName || firstTeamName.length < 1) && (!secondColor || secondColor.length < 1) && (!secondTeamName || secondTeamName.length < 1)) {
        return res.json(response.successFalse(2080, "최소 한 팀의 색상은 입력해주세요."));
    } else if (challengeType === 'B' && (!firstColor || !firstTeamName || !secondColor || !secondTeamName)) {
        return res.json(response.successFalse(2090, "경쟁전은 양 팀의 색상과 팀 이름을 모두 입력해주세요."));
    } else if (challengeType === 'A' && (!firstColor)) {
        return res.json(response.successFalse(2100, "목표달성은 팀 색상을 입력해주세요."));
    }

    try {
        const checkRows = await adminDao.checkLeader(userId);
        if (checkRows === 0) return res.json(response.successFalse(3000, "리더가 아닙니다."));

        const image = req.file.location;
        // 목표달성
        if (challengeType === 'A') {
            firstTeamName = '목표';
            await adminDao.insertChallenge(challengeName, introduction, image, challengeType, distance, personnel, minLevel, maxLevel, startDate, endDate, firstColor, firstTeamName, null, null);
            logger.info(`${challengeName} - 목표달성 챌린지 생성 완료`);
            
            const challengeId = await adminDao.getRecentChallengeId();
            if (cardId) {
                for (var i = 0; i < cardId.length; i++) {
                    await adminDao.postChallengeCard(challengeId, cardId[i]);
                }
                logger.info(`${challengeName} - 해당 카드 부여 완료`)
            }
            await adminDao.insertChallengeLeader(userId, challengeId);
            logger.info(`${challengeId}번 챌린지 리더 배치 완료`);
        // 경쟁전
        } else {
            await adminDao.insertChallenge(challengeName, introduction, image, challengeType, distance, personnel, minLevel, maxLevel, startDate, endDate, firstColor, firstTeamName, secondColor, secondTeamName);
            logger.info(`${challengeName} - 경쟁전 챌린지 생성 완료`);

            const challengeId = await adminDao.getRecentChallengeId();
            if (cardId) {
                for (var i = 0; i < cardId.length; i++) {
                    await adminDao.postChallengeCard(challengeId, cardId[i]);
                }
                logger.info(`${challengeName} - 해당 카드 부여 완료`)
            }
            await adminDao.insertChallengeLeader(userId, challengeId);
            logger.info(`${challengeName} - 리더 배치 완료`);
        }
        return res.json(response.successTrue(1000, "챌린지 생성에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - createChallenge Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-27
 * 미션 생성 API
 */
exports.createMission = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        nickname, distance, time
    } = req.body;

    if (!nickname) return res.json(response.successFalse(2000, "리더 닉네임을 입력해주세요."));
    if (!distance) return res.json(response.successFalse(2010, "미션 목표 거리를 입력해주세요."));
    if (!time) return res.json(response.successFalse(2020, "미션 목표 시간을 입력해주세요."));
    
    try {
        const checkRows = await adminDao.checkLeader(userId);
        if (checkRows === 0) return res.json(response.successFalse(3000, "리더가 아닙니다."));

        const nicknameCheck = await adminDao.checkNickname(nickname);
        if (nicknameCheck === 0) return res.json(response.successFalse(3010, "존재하지 않는 닉네임이거나 리더가 아닙니다."));
        logger.info(`리더 체크 완료`);

        const leaderId = await adminDao.getLeaderId(nickname);
        await adminDao.insertMission(leaderId, distance, time);
        logger.info(`리더 ${nickname} - 미션 생성 완료`);

        return res.json(response.successTrue(1000, "미션 생성에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - createMission Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-27
 * 레벨 조정 API
 */
exports.modifyLevel = async function (req, res) {
    const userId = req.verifiedToken.userId;

    try {
        const checkRows = await adminDao.checkAdmin(userId);
        if (checkRows === 0) return res.json(response.successFalse(3000, "관리자가 아닙니다."));

        const userLevelRows = await adminDao.getUserLevel();
        const levelRows = await adminDao.getLevel();

        for (var i = 0; i < userLevelRows.length; i++) {
            let userId = userLevelRows[i].userId;
            let tmp = await activityDao.getTotalRunning(`userId = ${userId}`);
            let totalDistance = tmp[0].totalDistance.slice(0, -2);
            let countMission = await runningDao.countClearMission(userId);

            for (var j = 0; j < levelRows.length; j++) {
                if (totalDistance < levelRows[j].maxDistance || countMission < levelRows[j].maxMission) {
                    await adminDao.patchUserLevel(userId, levelRows[j].level - 1);
                    break;
                }
            }
        }

        return res.json(response.successTrue(1000, "레벨 조정에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - modifyLevel Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-27
 * 공지 생성 API
 */
exports.createNotice = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        title, content
    } = req.body;

    if (!title || title.length < 1) return res.json(response.successFalse(2000, "공지 제목을 입력해주세요."));
    if (!content || content.length < 1) return res.json(response.successFalse(2010, "공지 내용을 입력해주세요."));
    
    try {
        const checkRows = await adminDao.checkAdmin(userId);
        if (checkRows === 0) return res.json(response.successFalse(3000, "관리자가 아닙니다."));

        if (!req.files.banner) {
            if (req.files.img) {
                const fileName = req.files.img[0].location.split('/')[4];
                s3.erase('/notice', fileName);
            }
            return res.json(response.successFalse(2020, "배너 이미지를 입력해주세요."));
        }
        
        
        if (req.files.img) {
            const image = req.files.img[0].location;
            const banner = req.files.banner[0].location;
            await adminDao.postNotice(title, content, image, banner);
        } else await adminDao.postNotice(title, content, null, req.files.banner[0].location);
        logger.info('공지 생성 완료');

        const totalFcmRows = await userDao.getAllPushUser();
        
        for (var i = 0; i < totalFcmRows.length; i++) {
            if (totalFcmRows[i].fcmToken !== null) {
                notification('[프로그라운드]', '띵동! 새로운 소식💌 이 도착했어요!', totalFcmRows[i].fcmToken);
            }
        }
        
        return res.json(response.successTrue(1000, "공지 생성에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - createNotice Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-28
 * 챌린지별 부여 API
 */
exports.spreadChallenge = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        typeId
    } = req.body;
    const { challengeId } = req.params;
    const { type } = req.query;

    if (!challengeId) return res.json(response.successFalse(2000, "챌린지 번호를 입력해주세요.")); 
    if (!typeId) return res.json(response.successFalse(2010, "타입 번호를 입력해주세요.")); 
    if (!type || (type !== "mission" && type !== "card")) return res.json(response.successFalse(2020, "올바른 타입을 입력해주세요.")); 
    
    try {
        const adminRows = await adminDao.checkLeader(userId);
        if (adminRows === 0) return res.json(response.successFalse(3000, "리더가 아닙니다."));

        const checkRows = await challengeDao.checkChallenge(challengeId);
        if (checkRows === 0) return res.json(response.successFalse(3010, "존재하지 않는 챌린지입니다."));

        const challengeRows = await userDao.getAllUserChallenge(challengeId);
        if (type === "mission") {
            for (var i = 0; i < challengeRows.length; i++) {
                await adminDao.postUserMission(challengeRows[i].userId, typeId);

                if (challengeRows[i].fcmToken !== null && challengeRows[i].isNotified === 'Y' && challengeRows[i].isLogedIn === 'Y') {
                    notification('[프로그라운드]', '짜잔! 새로운 미션이 도착했어요!', challengeRows[i].fcmToken);
                }
            }

            return res.json(response.successTrue(1000, "챌린지별 미션 부여에 성공하였습니다."));
        } else if (type === "card") {
            for (var i = 0; i < challengeRows.length; i++) {
                await adminDao.postUserCard(challengeRows[i].userId, typeId);

                if (challengeRows[i].fcmToken !== null && challengeRows[i].isNotified === 'Y' && challengeRows[i].isLogedIn === 'Y') {
                    notification('[프로그라운드]', '우와! 새로운 카드✨ 가 도착했어요!', challengeRows[i].fcmToken);
                }
            }

            return res.json(response.successTrue(1010, "챌린지별 카드 부여에 성공하였습니다."));
        }
    } catch (err) {
        logger.error(`App - spreadChallenge Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-28
 * 레벨별 부여 API
 */
exports.spreadLevel = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        typeId
    } = req.body;
    const { level } = req.params;
    const { type } = req.query;

    if (!level) return res.json(response.successFalse(2000, "레벨을 입력해주세요.")); 
    if (!typeId) return res.json(response.successFalse(2010, "타입 번호를 입력해주세요.")); 
    if (!type || (type !== "mission" && type !== "card")) return res.json(response.successFalse(2020, "올바른 타입을 입력해주세요.")); 
    
    try {
        const checkRows = await adminDao.checkLeader(userId);
        if (checkRows === 0) return res.json(response.successFalse(3000, "리더가 아닙니다."));

        if (level < 0 || level > 9) return res.json(response.successFalse(3010, "레벨은 1~9까지만 존재합니다."));

        const levelRows = await userDao.getAllUserLevel(level);
        if (type === "mission") {
            for (var i = 0; i < levelRows.length; i++) {
                await adminDao.postUserMission(levelRows[i].userId, typeId);

                if (levelRows[i].fcmToken !== null && levelRows[i].isNotified === 'Y' && levelRows[i].isLogedIn === 'Y') {
                    notification('[프로그라운드]', '짜잔! 새로운 미션이 도착했어요!', levelRows[i].fcmToken);
                }
            }

            return res.json(response.successTrue(1000, "레벨별 미션 부여에 성공하였습니다."));
        } else if (type === "card") {
            for (var i = 0; i < levelRows.length; i++) {
                await adminDao.postUserCard(levelRows[i].userId, typeId);

                if (levelRows[i].fcmToken !== null && levelRows[i].isNotified === 'Y' && levelRows[i].isLogedIn === 'Y') {
                    notification('[프로그라운드]', '우와! 새로운 카드✨ 가 도착했어요!', levelRows[i].fcmToken);
                }
            }

            return res.json(response.successTrue(1010, "레벨별 카드 부여에 성공하였습니다."));
        }
    } catch (err) {
        logger.error(`App - spreadLevel Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-28
 * 사용자별 부여 API
 */
exports.spreadUser = async function (req, res) {
    const uuserId = req.verifiedToken.userId;
    const {
        typeId
    } = req.body;
    const { userId } = req.params;
    const { type } = req.query;

    if (!userId) return res.json(response.successFalse(2000, "회원 번호를 입력해주세요.")); 
    if (!typeId) return res.json(response.successFalse(2010, "타입 번호를 입력해주세요.")); 
    if (!type || (type !== "mission" && type !== "card")) return res.json(response.successFalse(2020, "올바른 타입을 입력해주세요.")); 
    
    try {
        const checkRows = await adminDao.checkLeader(uuserId);
        if (checkRows === 0) return res.json(response.successFalse(3000, "리더가 아닙니다."));

        const profileRows = await userDao.checkUserId(userId);
        if (profileRows === 0) return res.json(response.successFalse(3010, "존재하지 않는 사용자입니다."));

        const userRows = await userDao.getUserFcmToken(userId);
        if (type === "mission") {
            await adminDao.postUserMission(userRows.userId, typeId);

            if (userRows.fcmToken !== null && userRows.isNotified === 'Y' && userRows.isLogedIn === 'Y') {
                notification('[프로그라운드]', '짜잔! 새로운 미션이 도착했어요!', userRows.fcmToken);
            }
            return res.json(response.successTrue(1000, "회원별 미션 부여에 성공하였습니다."));
        } else if (type === "card") {
            await adminDao.postUserCard(userRows.userId, typeId);

            if (userRows.fcmToken !== null && userRows.isNotified === 'Y' && userRows.isLogedIn === 'Y') {
                notification('[프로그라운드]', '우와! 새로운 카드✨ 가 도착했어요!', userRows.fcmToken);
            }
            return res.json(response.successTrue(1010, "회원별 카드 부여에 성공하였습니다."));
        }
    } catch (err) {
        logger.error(`App - spreadUser Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
