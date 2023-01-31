const db = require('../../database');
const Device = db.collection('devices');

const jwt = require('jsonwebtoken')
module.exports = {
    //get all device
    async index(req, res) {
        try{
            const devices = await Device.where("ownerId","==",req.params.ownerID).get().then((querySnapshot) => {
                return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
            })
            res.send(devices)
        }catch(err){
            res.status(500).send(err)
        }
    },
    // initiate machine or create connection
    async connection(req, res) {
        try {
            const cookies = req.cookies;

            const {hardwareId} = req.body
            if(!hardwareId) return res.status(400).json({'message': 'HardwareId is required'})
            
            const deviceType = req.body.type? req.body.type : 'hydroponic'
            
            const findDevice = await Device.where("hardwareId","==",hardwareId).get().then((querySnapshot) => {
                return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
            });
            
            let responseJson = {
                'message': `New ${deviceType}, Hardware: ${hardwareId} created. Waiting for admin set active`,
                'status' : true,
                'active' : false,
                'accessToken': "",
            }
            if(findDevice.length > 0){
                
                const device = findDevice[0]

                if(!device.active){
                    responseJson.message = "Device is not active"
                    return res.send(responseJson);
                }else{
                    responseJson.message = "SUCCESS"
                    responseJson.active = true
                    //creat JWTs
                    const accessToken = jwt.sign(
                        { "DeviceInfo": 
                            {
                                "hardwareId": device.hardwareId,
                            }
                        },
                        process.env.ACCESS_TOKEN_SECRET,
                        { expiresIn: '1h' }
                    )
                    //refreshToken
                    const newRefreshToken = jwt.sign(
                        { "hardwareId": device.hardwareId },
                        process.env.REFRESH_TOKEN_SECRET,
                        { expiresIn: '1d' } 
                    )

                    responseJson.accessToken = accessToken;
                    const newRefreshTokenArray = 
                    !cookies?.jwt
                        ? device.refreshToken
                        : device.refreshToken.filter(rt => rt !== cookies.jwt);
                    
                    if(cookies?.jwt) res.clearCookie('jwt', { httpOnly: true/*, secure: true*/, sameSite: 'None'})

                    //Saving refreshToken with current user
                    await Device.doc(device.id).update({ "refreshToken": [...newRefreshTokenArray,newRefreshToken] })
                    res.cookie('jwt', newRefreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
                    return res.send(responseJson);
                }
                
            }

            //store the new device
            const created_at = Math.floor(new Date().getTime() / 1000)
            await Device.add({"name": "", "desc": "", "ownerId": "", "type": deviceType, "hardwareId": hardwareId, "active": false,"refreshToken" : [], "created_at": created_at});
            res.send(responseJson)
        } catch (err) {
            console.error(err)
            res.status(500).send(err)
        }

    },

    //Refresh Token
    async handleRefreshToken(req, res){
        const cookies = req.cookies
        if(!cookies?.jwt) return res.sendStatus(401);
        const refreshToken = cookies.jwt;
        res.clearCookie('jwt', { httpOnly: true/*, secure: true*/, sameSite: 'None' })
      
        const devices = await Device.where("refreshToken", 'array-contains', refreshToken).get().then((querySnapshot) => {
          return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
        });
  
        // Detected refresh token reuse!
        if (devices.length <= 0){
          jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err,decoded) => {
              if(err) return res.sendStatus(403); //Forbidden
              console.log('attempted refresh token reuse!')
              const hackedDevice = await Device.where("hardwareId", "==", decoded.hardwareId).get().then((querySnapshot) => {
                return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
              });
              if(hackedDevice.length > 0){
                await Device.doc(hackedDevice[0].id).update({ "refreshToken": [] })
              }
            }
          )
          return res.sendStatus(403) //Forbidden
        }
  
        const device = devices[0];
  
        const newRefreshTokenArray =  device.refreshToken.filter(rt => rt !== refreshToken);
      
        // evaluate jwt
        
        jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET,
          async (err,decoded) => {
            if(err){
              console.log('expired refresh token')
              await Device.doc(device.id).update({ "refreshToken": [...newRefreshTokenArray] })
            }
            if(err || device.hardwareId !== decoded.hardwareId) return res.sendStatus(403);
  
            //Refresh token was still valid

            const accessToken = jwt.sign(
                { "DeviceInfo": 
                    {
                        "hardwareId": device.hardwareId,
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1h' }
            )
            const newRefreshToken = jwt.sign(
                { "hardwareId": device.hardwareId },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            )
            //Saving refreshToken with current user
            await Device.doc(device.id).update({ "refreshToken": [...newRefreshTokenArray, newRefreshToken] })
            res.cookie('jwt', newRefreshToken, { httpOnly: true/*, secure: true*/, maxAge: 24 * 60 * 60 * 1000 })
            res.json({ accessToken })
          }
        )
      },

    // edit device
    async put(req, res) {
        try{
            const device = await Device.doc(req.params.hydroponicId).get()
            if(!device.exists){
                return res.status(403).send({
                    error: 'The device information was incorrect'
                })
            }

            const hardwareId = device.data().hardwareId
            req.body.hardwareId = hardwareId

            await Device.doc(req.params.hydroponicId).set(req.body)
            res.send(req.body)
        }catch(err){
            res.status(500).send(err)
        }
    },

    // delete device
    async remove(req, res) {
        try{
            const device = await Device.doc(req.params.hydroponicId).get()
            if(!device.exists){
                return res.status(403).send({
                    error: 'The device information was incorrect'
                })
            }
            await Device.doc(req.params.hydroponicId).delete()
            res.send({"hardwareId": device.data().hardwareId})
        }catch(err){
            return res.status(500).send(err)
        }
    },

    // show device
    async show(req, res) {
        try{
            const device = await Device.doc(req.params.hydroponicId).get()
            if(!device.exists){
                return res.status(403).send({
                    error: 'The hydroponic information was incorrect'
                })
            }
            res.send(device.data())
        }catch(err){
            res.status(500).send(err)
        }
    },
    // binding device with owner
    async binding(req, res) {
        try{
            const {ownerId} = req.body
            if(!ownerId) return res.status(400).json({'message': 'ownerId is required!'}) 

            const device = await Device.doc(req.params.hydroponicId).get()
            
            if(!device.exists){
                return res.status(403).send({
                    error: 'The device information was incorrect'
                })
            }

            await Device.doc(req.params.hydroponicId).update({
                "ownerId": ownerId,
              });
            res.send(req.body)
        }catch(err){
            res.status(500).send(err)
        }
    }

}