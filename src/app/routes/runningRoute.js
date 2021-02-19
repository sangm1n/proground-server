module.exports = function(app){
    const running = require('../controllers/runningController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/running').post(running.recordRunning);
    app.route('/running/counts').get(running.countRunning);
};
