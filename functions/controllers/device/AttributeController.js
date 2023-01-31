const db = require('../../database');
const Device = db.collection('devices');

module.exports = {
    async create(req,res){

        try {
            let responseJson = {
                'message': '',
                'status': false,
                'payload' : ''
            }

            const body = req.body
            
            const hardwareId = req.params.hardwareId
            if(!hardwareId) {
                responseJson.message = 'hardwareId is required'
                return res.status(400).json(responseJson)
            }

            const findDevice = await Device.where("hardwareId","==",hardwareId).get().then((querySnapshot) => {
                return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
            });

            if(findDevice.length === 0){
                responseJson.message = 'hardwareId is not found'
                return res.status(400).json(responseJson)
            }

            const device = findDevice[0];

            if(!device.active){
                responseJson.message = "Device is not active"
                return res.status(400).json(responseJson);
            }
            
            if(body // 👈 null and undefined check
            && Object.keys(body).length === 0
            && Object.getPrototypeOf(obj) === Object.prototype){
                responseJson.message = "Json is null"
                return res.status(400).json(responseJson);
            }

            const created_at = Math.floor(new Date().getTime() / 1000)
            body.created_at = created_at

            await Device.doc(device.id).update({
                "attributes": body,
              });
              
            responseJson.status = true
            return res.status(200).json(responseJson)
            
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    
}