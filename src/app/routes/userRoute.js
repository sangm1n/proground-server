module.exports = function(app){
    const passport = require('passport');
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/signup').post(user.signUp);
    app.route('/signup/:userId').post(user.signUpAdd);
    app.route('/login').post(user.logIn);
    app.route('/login/kakao').post(user.logInKakao);
    app.route('/login/auto').get(jwtMiddleware, user.check);

    // 테스트용
    app.route('/kakao').get(passport.authenticate('kakao-login'));
    app.route('/auth/kakao/callback').get(passport.authenticate('kakao-login', {
        failureRedirect: '/'
    }), (req, res) => {
        res.redirect('/');
    });
};