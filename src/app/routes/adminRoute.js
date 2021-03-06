module.exports = function(app){
    const admin = require('../controllers/adminController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');
    const s3 = require('../../utils/awsS3');

    app.route('/admin/leader').post(jwtMiddleware, s3.upload('/profile').single('img'), admin.createLeader);
    app.route('/admin/challenge').post(jwtMiddleware, s3.upload('/challenge').single('img'), admin.createChallenge);
    app.route('/admin/mission').post(jwtMiddleware, admin.createMission);

    app.route('/admin/challenges/:challengeId').post(jwtMiddleware, admin.spreadChallenge);
    app.route('/admin/levels/:level').post(jwtMiddleware, admin.spreadLevel);
    app.route('/admin/users/:userId').post(jwtMiddleware, admin.spreadUser);

    app.route('/admin/level').post(jwtMiddleware, admin.modifyLevel);
    app.route('/admin/notice').post(jwtMiddleware, s3.upload('/notice').fields([
        { name: 'img', maxCount: 1 }, { name: 'banner', maxCount: 1 }
    ]), admin.createNotice);
};
