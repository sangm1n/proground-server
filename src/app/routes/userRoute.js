const { json } = require('express');

module.exports = function(app){
    const passport = require('passport');
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    const upload = require('../../utils/awsS3');

    app.route('/signup').post(user.signUp);
    app.route('/signup/check-email').post(user.checkEmail);
    app.route('/login').post(user.logIn);
    app.route('/login/kakao').post(user.logInKakao);
    app.route('/login/auto').get(jwtMiddleware, user.check);

    app.route('/user/password').post(jwtMiddleware, user.findPassword);


    // 테스트용
    app.route('/image').post(upload('/profile').single('img'));
    app.route('/kakao').get(passport.authenticate('kakao-login'));
    app.route('/auth/kakao/callback').get(passport.authenticate('kakao-login', {
        failureRedirect: '/'
    }), (req, res) => {
        res.redirect('/');
    });    
};