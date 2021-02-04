module.exports = function(app){
    const challenge = require('../controllers/challengeController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/challenges/all').get(challenge.allChallenges);
    app.route('/challenges/my').get(jwtMiddleware, challenge.myChallenge);
    app.route('/challenges/:challengeId').get(challenge.challengeInfo);
    app.route('/challenges/:challengeId').post(jwtMiddleware, challenge.registerChallenge);
    app.route('/challenges/:challengeId/out').post(jwtMiddleware, challenge.outChallenge);
    app.route('/challenges/:challengeId/stats/today').get(jwtMiddleware, challenge.todayChallengeStastics);
    app.route('/challenges/:challengeId/stats/total').get(jwtMiddleware, challenge.totalChallengeStastics);
};
