const { json } = require('express');

module.exports = function(app){
    const passport = require('passport');
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    const s3 = require('../../utils/awsS3');

    app.route('/signup').post(user.signUp);
    app.route('/signup/check-email').post(user.checkEmail);
    app.route('/login').post(user.logIn);
    app.route('/login/kakao').post(user.logInKakao);
    app.route('/login/auto').get(jwtMiddleware, user.check);

    app.route('/user/profile').get(jwtMiddleware, user.profile);
    app.route('/user/profile').patch(jwtMiddleware, user.updateProfile);
    app.route('/user/profile/image').patch(jwtMiddleware, s3.upload('/profile').single('img'), user.updateProfileImage);
    app.route('/user/password/find').post(user.findPassword);
    app.route('/user/password/change').post(jwtMiddleware, user.changePassword);
    app.route('/user/level').get(jwtMiddleware, user.userLevel);
    app.route('/user/question').post(user.userQuestion);
    app.route('/non-user').post(user.nonUser);

    // 테스트용
    app.route('/image').post(s3.upload('/profile').single('img'));
    app.route('/kakao').get(passport.authenticate('kakao-login'));
    app.route('/auth/kakao/callback').get(passport.authenticate('kakao-login', {
        failureRedirect: '/'
    }), (req, res) => {
        res.redirect('/');
    });    
};
