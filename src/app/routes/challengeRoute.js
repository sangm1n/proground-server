module.exports = function(app){
    const challenge = require('../controllers/challengeController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/challenges/all').get(challenge.allChallenges);
    app.route('/challenges/my').get(jwtMiddleware, challenge.myChallenge);
    app.route('/challenges/:challengeId').get(challenge.challengeInfo);
    app.route('/challenges/:challengeId').post(jwtMiddleware, challenge.registerChallenge);
    app.route('/challenges/:challengeId/out').post(jwtMiddleware, challenge.outChallenge);
    app.route('/challenges/:challengeId/statistic').get(jwtMiddleware, challenge.challengeStatistic);
    app.route('/challenges/:challengeId/graph').get(jwtMiddleware, challenge.challengeGraph);
};
