module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/signup').post(user.signUp);
    app.route('/signup/:userId').post(user.signUpAdd);
    app.route('/login').get(user.logIn);
};