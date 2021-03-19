module.exports = function(app){
    const notice = require('../controllers/noticeController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/notices').post(notice.allNotices);
    app.route('/notices/:noticeId').post(notice.noticeInfo);
};
