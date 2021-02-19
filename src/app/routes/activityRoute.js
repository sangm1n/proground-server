module.exports = function(app){
    const activity = require('../controllers/activityController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/activities/running', activity.runningStatistic);
    app.get('/activities/running/history', activity.runningHistory);
};
