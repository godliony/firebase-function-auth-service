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

    // edit device
    async put(req, res) {
        try{
            const device = await Device.doc(req.params.hardwareId).get()
            if(!device.exists){
                return res.status(403).send({
                    error: 'The device information was incorrect'
                })
            }

            const hardwareId = device.data().hardwareId
            req.body.hardwareId = hardwareId

            await Device.doc(req.params.hardwareId).set(req.body)
            res.send(req.body)
        }catch(err){
            res.status(500).send(err)
        }
    },

    // delete device
    async remove(req, res) {
        try{
            const device = await Device.doc(req.params.hardwareId).get()
            if(!device.exists){
                return res.status(403).send({
                    error: 'The device information was incorrect'
                })
            }
            await Device.doc(req.params.hardwareId).delete()
            res.send({"hardwareId": device.data().hardwareId})
        }catch(err){
            return res.status(500).send(err)
        }
    },

    // show device
    async show(req, res) {
        try{
            const device = await Device.doc(req.params.hardwareId).get()
            if(!device.exists){
                return res.status(403).send({
                    error: 'The device information was incorrect'
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

            const device = await Device.doc(req.params.hardwareId).get()
            
            if(!device.exists){
                return res.status(403).send({
                    error: 'The device information was incorrect'
                })
            }

            await Device.doc(req.params.hardwareId).update({
                "ownerId": ownerId,
              });
            res.send(req.body)
        }catch(err){
            res.status(500).send(err)
        }
    }

}