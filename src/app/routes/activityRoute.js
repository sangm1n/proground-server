module.exports = function(app){
    const activity = require('../controllers/activityController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/activities/:nonUserId/running/', activity.runningStatistic);
    app.get('/activities/:nonUserId/running/history', activity.runningHistory);
    app.get('/activities/:nonUserId/mission/todo', activity.missionToDo);
    app.get('/activities/:nonUserId/mission/finish', activity.missionHistory);
    app.get('/activities/:nonUserId/card', activity.cardHistory);
    app.get('/activities/:nonUserId/challenge', activity.challengeHistory);
};
