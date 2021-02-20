module.exports = function(app){
    const activity = require('../controllers/activityController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/activities/running', activity.runningStatistic);
    app.get('/activities/running/history', activity.runningHistory);
    app.get('/activities/mission/todo', activity.missionToDo);
    app.get('/activities/mission/finish', activity.missionHistory);
    app.get('/activities/card', activity.cardHistory);
    app.get('/activities/challenge', activity.challengeHistory);
};
