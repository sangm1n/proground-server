const express = require('./config/express');
const {logger} = require('./config/winston');

const schedule = require('node-schedule');
const runningDao = require('./src/app/dao/runningDao');
const userDao = require('./src/app/dao/userDao');
const notification = require('./src/utils/notification');

let port;

if (process.env.NODE_ENV === 'development') {
    port = 3000;
} else if (process.env.NODE_ENV === 'production') {
    port = 3001;
}

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
})

express().listen(port);
logger.info(`${process.env.NODE_ENV} - API Server Start At Port ${port}`);