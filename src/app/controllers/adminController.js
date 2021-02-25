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
    const userId = req.verifiedToken.userId;
    let {
        challengeName, introduction, challengeType, distance, personnel, minLevel, maxLevel, startDate, endDate, firstColor, firstTeamName, secondColor, secondTeamName
    } = req.body;
    
    if (req.file === undefined) return res.json(response.successFalse(2000, "챌린지 이미지를 입력해주세요."));
    if (!challengeName) return res.json(response.successFalse(2010, "챌린지 이름을 입력해주세요."));
    if (!introduction) return res.json(response.successFalse(2020, "챌린지 소개를 입력해주세요."));
    if (!challengeType) return res.json(response.successFalse(2030, "챌린지 타입을 입력해주세요."));
    if (!distance) return res.json(response.successFalse(2040, "챌린지 목표 거리를 입력해주세요."));
    if (!personnel) return res.json(response.successFalse(2050, "챌린지 수용 인원를 입력해주세요."));
    if (!minLevel || !maxLevel) return res.json(response.successFalse(2060, "챌린지 레벨 범위를 올바르게 입력해주세요."));
    if (!startDate || !endDate) return res.json(response.successFalse(2070, "챌린지 날짜 범위를 올바르게 입력해주세요."));

    // A: 목표달성, B: 경쟁전
    if (!firstColor && !firstTeamName && !secondColor && !secondTeamName) {
        return res.json(response.successFalse(2080, "최소 한 팀의 색상은 입력해주세요."));
    } else if (challengeType === 'B' && (!firstColor || !firstTeamName || !secondColor || !secondTeamName)) {
        return res.json(response.successFalse(2090, "경쟁전은 양 팀의 색상과 팀 이름을 모두 입력해주세요."));
    } else if (challengeType === 'A' && (!firstColor)) {
        return res.json(response.successFalse(2100, "목표달성은 팀 색상을 입력해주세요."));
    }

    try {
        const checkRows = await adminDao.checkAdmin(userId);
        if (checkRows === 0) return res.json(response.successFalse(3000, "관리자가 아닙니다."));

        const image = req.file.location;
        // 목표달성
        if (challengeType === 'A') {
            firstTeamName = '목표';
            await adminDao.insertChallenge(challengeName, introduction, image, challengeType, distance, personnel, minLevel, maxLevel, startDate, endDate, firstColor, firstTeamName, null, null);
            logger.info(`${challengeName} - 목표달성 챌린지 생성 완료`);
        // 경쟁전
        } else {
            await adminDao.insertChallenge(challengeName, introduction, image, challengeType, distance, personnel, minLevel, maxLevel, startDate, endDate, firstColor, firstTeamName, secondColor, secondTeamName);
            logger.info(`${challengeName} - 경쟁전 챌린지 생성 완료`);
        }
        return res.json(response.successTrue(1000, "챌린지 생성에 완료하였습니다."));
    } catch (err) {
        logger.error(`App - createChallenge Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
