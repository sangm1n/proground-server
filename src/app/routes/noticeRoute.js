module.exports = function(app){
    const notice = require('../controllers/noticeController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/notices').get(notice.allNotices);
    app.route('/notices/:noticeId').get(notice.noticeInfo);
};
