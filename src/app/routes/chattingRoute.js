module.exports = function(app){
    const chat = require('../controllers/chattingController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/challenges/:challengeId/chats').get(jwtMiddleware, chat.allChatting);
    app.route('/challenges/:challengeId/chat').post(jwtMiddleware, chat.makeChatting);
};
