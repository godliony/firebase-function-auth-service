const AuthController = require('./controllers/AuthController')
const DeviceController = require('./controllers/device/DeviceController')
const UserController = require('./controllers/admin/UserController')
const LoggingController = require('./controllers/device/LoggingController')

//Admin
const AdminDeviceController = require('./controllers/admin/DeviceController')


const verifyJWT = require('./middleware/verifyJWT')
const ROLES_LIST = require('./config/roles_list')
const verifyRoles = require('./middleware/verifyRoles')

module.exports = (app) => {
    // RESFUL Api for users management

    //Admin Routes

    app.get('/admin/device', AdminDeviceController.index) //initiate machine or create connection

    // Create user
    app.post('/login', AuthController.handleLogin)
    app.get('/refreshToken', AuthController.handleRefreshToken)
    app.get('/logout', AuthController.handleLogout)
    app.post('/register', AuthController.handleRegister)


    app.get('/device/logging', LoggingController.index)




    app.post('/device/connection', DeviceController.connection) //initiate machine or create connection
    app.get('/device/refreshToken', DeviceController.handleRefreshToken) // refreshToken of device
    /* app.put('/device/:hydroponicId',DeviceController.put) // Edit device
    app.delete('/device/:hydroponicId',DeviceController.remove) // Delete user
    app.get('/device/:hydroponicId',DeviceController.show) // Show device by id */
    
    //Below this line need jwtToken (Login)
    //app.use(verifyJWT) 
    // Get all user
    //app.get('/users',verifyRoles(ROLES_LIST.User),UserController.index)
    app.get('/hydroponics/:ownerID',DeviceController.index)
    
    app.patch('/hydroponic/:hydroponicId',DeviceController.binding)







    // Create user
    app.post('/user', UserController.create)
    // Edit user
    app.put('/user/:userId',UserController.put)
    // Delete user
    app.delete('/user/:userId',UserController.remove)
    // Get user by id
    
    app.get('/user/:userId',UserController.show)
    
    //Below this line need jwtToken (Login)
    //app.use(verifyJWT) 
    // Get all user
    //app.get('/users',verifyRoles(ROLES_LIST.User),UserController.index)
    app.get('/users',UserController.index)
}