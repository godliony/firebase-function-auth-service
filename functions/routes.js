const AuthController = require('./controllers/AuthController')

module.exports = (app) => {
    // RESFUL Api for users management

    // Create user
    app.post('/login', AuthController.login)
}