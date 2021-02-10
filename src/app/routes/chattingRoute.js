module.exports = function(app){
    const chat = require('../controllers/chattingController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');
    const s3 = require('../../utils/awsS3');

    app.route('/challenges/:challengeId/chats').get(jwtMiddleware, chat.allChatting);
    app.route('/challenges/:challengeId/chat').post(jwtMiddleware, s3.upload('/chatting').array('img', 'message', 'parentChattingId'), chat.makeChatting);
};
