module.exports = function(app){
    const admin = require('../controllers/adminController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');
    const s3 = require('../../utils/awsS3');

    app.route('/admin/leader').post(jwtMiddleware, s3.upload('/profile').single('img'), admin.createLeader);
    app.route('/admin/challenge').post(jwtMiddleware, s3.upload('/challenge').single('img'), admin.createChallenge);
};
