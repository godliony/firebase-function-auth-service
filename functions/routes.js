const AuthController = require('./controllers/AuthController')
const DeviceController = require('./controllers/device/DeviceController')
const UserController = require('./controllers/admin/UserController')
const LoggingController = require('./controllers/device/LoggingController')
const AttributeController = require('./controllers/device/AttributeController')
const AssetController = require('./controllers/AssetController')

//Admin
const AdminDeviceController = require('./controllers/admin/DeviceController')
const AdminAssetController = require('./controllers/admin/AssetController')


const verifyJWT = require('./middleware/verifyJWT')
const ROLES_LIST = require('./config/roles_list')
const verifyRoles = require('./middleware/verifyRoles')

module.exports = (app) => {
    // RESFUL Api for users management

    

    // Create user
    app.post('/auth/login', AuthController.handleLogin)
    app.get('/auth/refreshToken', AuthController.handleRefreshToken)
    app.get('/auth/logout', AuthController.handleLogout)
    app.post('/auth/register', AuthController.handleRegister)


    app.get('/device/logging/:hardwareId', LoggingController.index)
    app.post('/device/logging/:hardwareId', LoggingController.create)

    app.post('/device/attribute/:hardwareId',AttributeController.create)

    app.use(verifyJWT) 

    //Admin Routes

    app.get('/admin/device',verifyRoles(ROLES_LIST.Admin), AdminDeviceController.index)

    app.get('/admin/assets',verifyRoles(ROLES_LIST.Admin), AdminAssetController.index)
    app.get('/admin/asset/:assetId',verifyRoles(ROLES_LIST.Admin), AdminAssetController.show)
    app.post('/admin/asset',verifyRoles(ROLES_LIST.Admin), AdminAssetController.create)
    app.put('/admin/asset/:assetId',verifyRoles(ROLES_LIST.Admin), AdminAssetController.put)
    app.delete('/admin/asset/:assetId',verifyRoles(ROLES_LIST.Admin), AdminAssetController.remove)

    // Asset Routes
    app.get('/assets',AssetController.index)
    app.get('/asset/:assetId',AssetController.show)
    app.post('/asset',AssetController.create)
    app.put('/asset/:assetId',AssetController.put)
    app.delete('/asset/:assetId',AssetController.remove)

    app.get('/asset/:assetId/devices', AssetController.getDevicesInAsset)




    app.post('/device/connection', DeviceController.connection) //initiate machine or create connection
    app.put('/device/:hardwareId',DeviceController.put) // Edit device
    app.delete('/device/:hardwareId',DeviceController.remove) // Delete device
    app.get('/device/:hardwareId',DeviceController.show) // Show device by id 
    
    //Below this line need jwtToken (Login)
    //app.use(verifyJWT) 
    // Get all user
    //app.get('/users',verifyRoles(ROLES_LIST.User),UserController.index)
    app.get('/device/:ownerID',DeviceController.index)
    
    app.patch('/device/:hardwareId',DeviceController.binding)







    // Create user
    app.post('/user',verifyRoles(ROLES_LIST.Admin), UserController.create)
    // Edit user
    app.put('/user/:userId',verifyRoles(ROLES_LIST.Admin),UserController.put)
    // Delete user
    app.delete('/user/:userId',verifyRoles(ROLES_LIST.Admin),UserController.remove)
    // Get user by id
    
    app.get('/user/:userId',verifyRoles(ROLES_LIST.Admin),UserController.show)
    
    //Below this line need jwtToken (Login)
    //app.use(verifyJWT) 
    // Get all user
    //app.get('/users',verifyRoles(ROLES_LIST.User),UserController.index)
    app.get('/users',verifyRoles(ROLES_LIST.Admin),UserController.index)
}