const AuthController = require('./controllers/AuthController')
const refreshTokenController = require('./controllers/RefreshTokenController')

module.exports = (app) => {
    // RESFUL Api for users management

    // Create user
    app.post('/login', AuthController.login)
    app.get('/refreshToken', refreshTokenController.handleRefreshToken)
}