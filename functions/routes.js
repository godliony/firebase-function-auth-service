const AuthController = require('./controllers/AuthController')

module.exports = (app) => {
    // RESFUL Api for users management

    // Create user
    app.post('/login', AuthController.handleLogin)
    app.get('/refreshToken', AuthController.handleRefreshToken)
    app.get('/logout', AuthController.handleLogout)
    app.post('/register', AuthController.handleRegister)
}