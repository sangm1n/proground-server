const express = require('./config/express');
const {logger} = require('./config/winston');
const moment = require('moment');
require('moment-timezone');

const schedule = require('node-schedule');
const runningDao = require('./src/app/dao/runningDao');
const challengeDao = require('./src/app/dao/challengeDao');
const userDao = require('./src/app/dao/userDao');
const adminDao = require('./src/app/dao/adminDao');
const notification = require('./src/utils/notification');

let port;

if (process.env.NODE_ENV === 'development') {
    port = 3000;
} else if (process.env.NODE_ENV === 'production') {
    port = 3001;
}

moment.tz.setDefault("Asia/Seoul");

schedule.scheduleJob('0 0 18 * * *', async function() {
    console.log('현재 ' + new Date());
    const countRows = await runningDao.getRunningCount();
    const userFcmRows = await userDao.getAllUser();
    const nonUserFcmRows = await userDao.getAllNonUser();    
    const totalFcmRows = [...userFcmRows, ...nonUserFcmRows];
    
    for (var i = 0; i < totalFcmRows.length; i++) {
        if (totalFcmRows[i].fcmToken !== null) {
            notification('[프로그라운드]', `헛둘헛둘! 오늘 ${countRows.runningCount}명이 달렸어요! 🏃🏻`, totalFcmRows[i].fcmToken);
        }
    }
});

schedule.scheduleJob('0 0 0 * * *', async function() {
    let now = new Date();
    let today = now.getFullYear()+ '-' + (now.getMonth()+1).toString().padStart(2,'0') + '-' + now.getDate().toString().padStart(2,'0');
    let yesterday = new Date(now.setDate(now.getDate() - 1));
    yesterday = yesterday.getFullYear()+ '-' + (yesterday.getMonth()+1).toString().padStart(2,'0') + '-' + yesterday.getDate().toString().padStart(2,'0');

    const challengeRows = await challengeDao.todayChallenge(yesterday);
    for (var i = 0; i < challengeRows.length; i++) {
        logger.info('현재 ' + new Date());

        let challengeId = challengeRows[i].challengeId;
        let compareRows = await challengeDao.challengeStatus(challengeId);
        let totalDistance = compareRows.totalDistance;
        let challengeDistance = compareRows.distance;

        if (totalDistance >= challengeDistance) await challengeDao.challengeResult(challengeId, 'Y');
        else await challengeDao.challengeResult(challengeId, 'N');
        logger.info(`${challengeId}번 챌린지 종료 - 승리 여부 저장 완료`);
    }

    const missionRows = await adminDao.getMissionInfo();
    for (var i = 0; i < missionRows.length; i++) {
        let userId = missionRows[i].userId;
        let missionId = missionRows[i].missionId;
        let createdAt = missionRows[i].createdAt;

        await adminDao.updateUserMission(userId, missionId, createdAt);
        logger.info(`${userId}번 사용자의 ${missionId}번 미션 14일 지남 - 삭제 완료`);
    }
});

express().listen(port);
logger.info(`${process.env.NODE_ENV} - API Server Start At Port ${port}`);
