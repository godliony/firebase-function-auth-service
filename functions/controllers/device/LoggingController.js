const db = require('../../database');
const Loggings = db.collection('logs');
const Device = db.collection('devices');

module.exports = {
    async index(req, res){
        try{
            const start_at = req.query.start_at
            const end_at = req.query.end_at ? req.query.end_at : Math.floor(new Date().getTime() / 1000)
            const tags = req.query.tag
            const hardwareId = req.params.hardwareId
            if(!hardwareId) return res.status(400).json({'message': 'hardwareId is required'})
            if(!start_at) return res.status(400).json({'message': 'start_at is required'})
            let logs = Loggings.where("created_at",">=",Number(start_at)).where("created_at","<=",Number(end_at))
            logs = logs.where("hardwareId","==",hardwareId)
            let tagQuery = []
            if(tags){
                tagQuery = tags.split(",")
                tagQuery = [...tagQuery, 'created_at']
                logs = logs.select(...tagQuery)
            } 
            logs = await logs.get().then((querySnapshot) => {
                return querySnapshot.docs.map(doc => Object.assign(doc.data()))
            });

            let dataResponse = {}
            let obj = {
                created_at: [],
                value: []
            }
            
            for(let i=0; i<tagQuery.length-1; i++){
                for(let j=0; j<logs.length ;j++){
                    if(logs[j]?.[tagQuery[i]]){ // ถ้าใน key มี Tag ที่ User ต้องการ ก็จับยัดใส่ใน array และจัดรูปเพื่อให้ Frontend เอาไปใช้วาดกราฟง่ายๆ และประหยัด Bandwidth ด้วย
                        obj.created_at.push(logs[j].created_at)
                        obj.value.push(logs[j][tagQuery[i]])
                        dataResponse[tagQuery[i]] = obj
                    }
                }
                obj = {
                    created_at: [],
                    value: []
                }
            }
            
            res.send(dataResponse)
        }catch(err){
            console.error(err)
            res.status(500).send(err)
        }
    },
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
                return res.send(responseJson);
            }
            
            if(body // 👈 null and undefined check
            && Object.keys(body).length === 0
            && Object.getPrototypeOf(obj) === Object.prototype){
                responseJson.message = "Json is null"
                return res.send(responseJson);
            }

            const created_at = Math.floor(new Date().getTime() / 1000)
            body.created_at = created_at
            body.hardwareId = hardwareId
            await Loggings.add(body);
            responseJson.status = true
            return res.status(200).json(responseJson)
            
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    
}