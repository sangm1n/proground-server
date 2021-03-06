const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const response = require('../../utils/response');

const jwt = require('jsonwebtoken');
const secret_config = require('../../../config/secret');

const challengeDao = require('../dao/challengeDao');
const chattingDao = require('../dao/chattingDao');
const runningDao = require('../dao/runningDao');
const userDao = require('../dao/userDao');
let maxChallenge = 2;

/***
 * update : 2021-01-29
 * 전체 챌린지 조회 API
 */
exports.allChallenges = async function (req, res) {
    try {
        const challengeRows = await challengeDao.getAllChallenges();

        if (challengeRows.length === 0) return res.json(response.successTrue(1033, "참여중인 챌린지가 없습니다."));

        return res.json(response.successTrue(1020, "챌린지 조회에 성공하였습니다.", challengeRows));
    } catch (err) {
        logger.error(`App - allChallenges Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-01-30
 * My 챌린지 조회 API
 */
exports.myChallenge = async function (req, res) {
    const userId = req.verifiedToken.userId;

    try {
        let challengeRows;

        const userType = await userDao.checkLeader(userId);
        if (userType === 'L') challengeRows = await challengeDao.getLeaderMyChallenge(userId);
        else challengeRows = await challengeDao.getMyChallenge(userId);

        if (challengeRows.length === 0) return res.json(response.successTrue(1033, "참여중인 챌린지가 없습니다."));

        for (var i = 0; i < challengeRows.length; i++) {
            let challengeId = challengeRows[i].challengeId;
            let notReadCount = await chattingDao.getNotReadChatting(userId, challengeId);

            challengeRows[i]['notReadChattingCount'] = notReadCount;
        }

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
    let token = req.headers['x-access-token'] || req.query.token;
    const {
        challengeId
    } = req.params;

    if (token) token = jwt.verify(token, secret_config.jwtsecret);
    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));

    try {
        const checkRows = await challengeDao.checkChallenge(challengeId);
        if (checkRows === 0) return res.json(response.successFalse(3100, "존재하지 않는 챌린지입니다."));

        const challengeRows = await challengeDao.getChallenge(challengeId);
        const leaderRows = await challengeDao.getLeader(challengeId);
        const cardRows = await challengeDao.getCard(challengeId);
        const colorRows = await challengeDao.getColor(challengeId);

        // status - A: 참가 가능 / B: 참가 불가능 / C: 참가중 / D: 비회원
        let status;
        if (token === undefined) {
            status = 'D';
        } else {
            const userId = token.userId;

            const checkRegRows = await challengeDao.checkRegisterChallenge(userId, challengeId);
            const checkLevelRows = await challengeDao.checkChallengeLevel(userId, challengeId);
            const checkMaxRows = await challengeDao.checkMaxChallenge(userId);
            const dateRows = await challengeDao.challengeDate(challengeId);
            const countMembers = await challengeDao.getChallengeMembers(challengeId);
            const checkLeader = await userDao.checkLeader(userId);
            const checkOpenLeader = await challengeDao.checkOpenLeader(userId, challengeId);

            if (checkRegRows === 1 || (checkLeader === 'L' && checkOpenLeader === 1)) {
                status = 'C';
            } else if (checkLevelRows === 0 || checkMaxRows >= maxChallenge 
                || dateRows.endDate <= new Date() || countMembers >= challengeRows.personnel 
                || (checkLeader === 'L' && checkOpenLeader !== 1)) {
                status = 'B';
            } else {
                status = 'A';
            }
        }

        const result = {
            challenge: challengeRows,
            leader: leaderRows,
            card: cardRows,
            color: colorRows,
            status: status
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
    let {
        challengeColor, challengeTeamName
    } = req.body;
    
    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));
    if (!challengeColor) return res.json(response.successFalse(2101, "챌린지 색상을 입력해주세요"));
    if (!challengeTeamName) return res.json(response.successFalse(2102, "챌린지 팀 이름을 입력해주세요"));

    try {
        const checkRows = await challengeDao.checkChallenge(challengeId);
        if (checkRows === 0) return res.json(response.successFalse(3100, "존재하지 않는 챌린지입니다."));
        
        const checkRegRows = await challengeDao.checkRegisterChallenge(userId, challengeId);
        if (checkRegRows === 1) return res.json(response.successFalse(3101, "이미 참가한 챌린지입니다."));
        
        const challengeRows = await challengeDao.checkMaxChallenge(userId);
        if (challengeRows >= maxChallenge) return res.json(response.successFalse(3013, "챌린지 최대 참여 개수를 초과하였습니다."));

        const checkLevelRows = await challengeDao.checkChallengeLevel(userId, challengeId);
        if (checkLevelRows === 0) return res.json(response.successFalse(3102, "레벨에 맞지 않는 챌린지입니다."));

        const challengeType = await challengeDao.getChallengeType(challengeId);
        if (challengeType === 'A') challengeTeamName = '목표';

        if (challengeTeamName !== '목표') {
            const challengeInfoRows = await challengeDao.getChallengePersonnel(challengeId, challengeTeamName);
            const personnel = challengeInfoRows.personnel;
            const memberCount = challengeInfoRows.memberCount;
            if (parseInt(personnel / 2) === memberCount) return res.json(response.successFalse(3104, "이 팀은 수용 인원이 꽉 찼습니다."));
        }

        await challengeDao.postChallenge(userId, challengeId, challengeColor, challengeTeamName);
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
        await runningDao.deleteRunning(userId, challengeId);

        return res.json(response.successTrue(1031, "챌린지 탈퇴에 성공하였습니다."));
    } catch (err) {
        logger.error(`App - outChallenge Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-05
 * 챌린지 통계 조회 API
 */
exports.challengeStatistic = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {challengeId} = req.params;
    let {
        type, status
    } = req.query;

    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));
    if (status !== 'today' && status !== 'total') return res.json(response.successFalse(2080, "오늘은 today, 누적은 total을 입력해주세요."));
    if (type !== 'A' && type !== 'B') return res.json(response.successFalse(2081, "목표달성은 A, 경쟁전은 B를 입력해주세요."));

    try {
        const challengeType = await challengeDao.getChallengeType(challengeId);

        if (challengeType !== type) return res.json(response.successFalse(3100, "올바른 챌린지 타입이 아닙니다.")); 
        const checkRegRows = await challengeDao.checkRegisterChallenge(userId, challengeId);
        if (checkRegRows === 0) return res.json(response.successFalse(3101, "참가중인 챌린지가 아닙니다."));
        
        // 오늘
        if (status === 'today') {
            let statisticInfoRows;
            if (type === 'B') {
                statisticInfoRows = await challengeDao.getStatsInfo(userId, challengeId);
                if (statisticInfoRows.length === 0) return res.json(response.successTrue(1050, "아직 챌린지 통계가 없습니다."));

                logger.info(`Today/경쟁전 ${challengeId}번 챌린지 통계 조회 완료`);
                return res.json(response.successTrue(1200, "'오늘' 경쟁전 챌린지 통계 조회에 성공하였습니다.", statisticInfoRows));
            } else {
                statisticInfoRows = await challengeDao.getGoalStatsInfo(userId, challengeId);
                if (statisticInfoRows.length === 0) return res.json(response.successTrue(1050, "아직 챌린지 통계가 없습니다."));

                logger.info(`Today/목표달성 ${challengeId}번 챌린지 통계 조회 완료`);
                return res.json(response.successTrue(1201, "'오늘' 목표달성 챌린지 통계 조회에 성공하였습니다.", statisticInfoRows));
            }
        // 누적
        } else {
            let statisticInfoRows;
            if (type === 'B') {
                statisticInfoRows = await challengeDao.getStatsTotalInfo(userId, challengeId);
                if (statisticInfoRows.length === 0) return res.json(response.successTrue(1050, "아직 챌린지 통계가 없습니다."));

                logger.info(`Total/경쟁전 ${challengeId}번 챌린지 통계 조회 완료`);
                return res.json(response.successTrue(1202, "'누적' 경쟁전 챌린지 통계 조회에 성공하였습니다.", statisticInfoRows));
            } else {
                statisticInfoRows = await challengeDao.getGoalStatsTotalInfo(userId, challengeId);
                if (statisticInfoRows.length === 0) return res.json(response.successTrue(1050, "아직 챌린지 통계가 없습니다."));

                logger.info(`Total/목표달성 ${challengeId}번 챌린지 통계 조회 완료`);
                return res.json(response.successTrue(1203, "'누적' 목표달성 챌린지 통계 조회에 성공하였습니다.", statisticInfoRows));
            }
        }
    } catch (err) {
        logger.error(`App - challengeStatistic Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}

/***
 * update : 2021-02-05
 * 챌린지 그래프 조회 API
 */
exports.challengeGraph = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {challengeId} = req.params;
    const {
        type, status
    } = req.query;

    if (!challengeId) return res.json(response.successFalse(2100, "챌린지 번호를 입력해주세요."));
    if (status !== 'today' && status !== 'total') return res.json(response.successFalse(2080, "오늘은 today, 누적은 total을 입력해주세요."));
    if (type !== 'A' && type !== 'B') return res.json(response.successFalse(2081, "목표달성은 A, 경쟁전은 B를 입력해주세요."));

    try {
        const challengeType = await challengeDao.getChallengeType(challengeId);

        if (challengeType !== type) return res.json(response.successFalse(3100, "올바른 챌린지 타입이 아닙니다.")); 
        const checkRegRows = await challengeDao.checkRegisterChallenge(userId, challengeId);
        if (checkRegRows === 0) return res.json(response.successFalse(3101, "참가중인 챌린지가 아닙니다."));

        // 오늘
        if (status === 'today') {
            let graphRows;
            if (type === 'B') {
                graphRows = await challengeDao.getCompetitionGraphToday(challengeId);
                if (graphRows[0] === undefined || graphRows[1] === undefined) return res.json(response.successTrue(1050, "아직 챌린지 통계가 없습니다."));
                const result = {
                    firstTeam: graphRows[0],
                    secondTeam: graphRows[1]
                }
                logger.info(`Today/경쟁전 ${challengeId}번 챌린지 그래프 조회 완료`);
                return res.json(response.successTrue(1200, "'오늘' 경쟁전 챌린지 그래프 조회에 성공하였습니다.", result));
            } else {
                graphRows = await challengeDao.getGoalGraphToday(userId, challengeId);
                if (graphRows[0] === undefined || graphRows[1] === undefined) return res.json(response.successTrue(1050, "아직 챌린지 통계가 없습니다."));
                const result = {
                    user: graphRows[0],
                    team: graphRows[1]
                }
                logger.info(`Today/목표달성 ${challengeId}번 챌린지 그래프 조회 완료`);
                return res.json(response.successTrue(1201, "'오늘' 목표달성 챌린지 그래프 조회에 성공하였습니다.", result));
            }
        // 누적
        } else {
            let graphRows;
            if (type === 'B') {
                graphRows = await challengeDao.getCompetitionGraphTotal(challengeId);
                if (graphRows[0] === undefined || graphRows[1] === undefined) return res.json(response.successTrue(1050, "아직 챌린지 통계가 없습니다."));
                const result = {
                    firstTeam: graphRows[0],
                    secondTeam: graphRows[1]
                }
                logger.info(`Total/경쟁전 ${challengeId}번 챌린지 그래프 조회 완료`);
                return res.json(response.successTrue(1202, "'누적' 경쟁전 챌린지 그래프 조회에 성공하였습니다.", result));
            } else {
                graphRows = await challengeDao.getGoalGraphTotal(userId, challengeId);
                if (graphRows[0] === undefined || graphRows[1] === undefined) return res.json(response.successTrue(1050, "아직 챌린지 통계가 없습니다."));
                const result = {
                    user: graphRows[0],
                    challenge: graphRows[1]
                }
                logger.info(`Total/목표달성 ${challengeId}번 챌린지 그래프 조회 완료`);
                return res.json(response.successTrue(1203, "'누적' 목표달성 챌린지 그래프 조회에 성공하였습니다.", result));
            }
        }
    } catch (err) {
        logger.error(`App - challengeGraph Query error\n: ${err.message}`);
        return res.json(response.successFalse(4000, "서버와의 통신에 실패하였습니다."));
    }
}
