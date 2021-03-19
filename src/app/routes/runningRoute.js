module.exports = function(app){
    const running = require('../controllers/runningController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');
    const s3 = require('../../utils/awsS3');

    app.route('/running').post(s3.upload('/map').single('img'), running.recordRunning);
    app.route('/running/counts').post(running.countRunning);
    app.route('/running/:runningId/like').patch(jwtMiddleware, running.likeRunning);
    app.route('/running/:runningId/page').get(running.runningPage);
};
