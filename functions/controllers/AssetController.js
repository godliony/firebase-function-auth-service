const db = require('../database');
const Asset = db.collection('Asset');
const Device = db.collection('devices');
module.exports = {
    //get all assets
    async index(req, res) {
        try{
            const Assets = await Asset.where("ownerId","==", req.userId).select("name").get().then((querySnapshot) => {
                return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
                //return querySnapshot.docs.map(doc => Object.assign(doc.id))
            })
            res.send(Assets)
        }catch(err){
            console.log(err)
            res.status(500).send(err)
        }
    },
    // create asset
     async create(req, res) {
        let jsonResponse = {
            'message': '',
            'status' : false
        }
        try {
            let asset = req.body
            if(!asset.name){
                jsonResponse.status = false
                jsonResponse.message = `Please fill asset name!`
                return res.status(400).json(jsonResponse)
            }

            //store the new asset
            const created_at = Math.floor(new Date().getTime() / 1000)

            asset.created_at = created_at
            asset.ownerId = req.userId
            
            await Asset.add(asset);
            jsonResponse.status = true
            res.send(jsonResponse)
        } catch (err) {
            res.status(500).send(err)
        }

    },

    // edit device
     async put(req, res) {
        let jsonResponse = {
            'message': '',
            'status' : false
        }
        try{
            const asset = await Asset.doc(req.params.assetId).get()
            if(!asset.exists){
                jsonResponse.message = 'The asset information was incorrect'
                return res.status(403).send(jsonResponse)
            }
            const foundAsset = asset.data()
            if(foundAsset.ownerId !== req.userId){
                return res.sendStatus(403) //Forbidden
            }
            await Asset.doc(req.params.assetId).set(req.body)
            jsonResponse.status = true
            res.send(jsonResponse)
        }catch(err){
            console.log(err)
            res.status(500).send(err)
        }
    },

    // delete asset
    
    async remove(req, res) {
        let jsonResponse = {
            'message': '',
            'status' : false
        }
        try{
            const asset = await Asset.doc(req.params.assetId).get()
            if(!asset.exists){
                jsonResponse.message = 'The asset information was incorrect'
                return res.status(403).send(jsonResponse)
            }
            const foundAsset = asset.data()
            if(foundAsset.ownerId !== req.userId){
                return res.sendStatus(403) //Forbidden
            }

            await Asset.doc(req.params.assetId).delete()
            res.send(jsonResponse)
        }catch(err){
            return res.status(500).send(err)
        }
    },

    // show asset
    
    async show(req, res) {
        let jsonResponse = {
            'message': '',
            'status' : false
        }
        try{
            const asset = await Asset.doc(req.params.assetId).get()
            if(!asset.exists){
                return res.sendStatus(403) //Forbidden
            }
            const foundAsset = asset.data()
            if(foundAsset.ownerId !== req.userId){
                jsonResponse.message = `You don't have permission.`
                return res.status(403).send(jsonResponse)
            }
            jsonResponse.data = foundAsset
            jsonResponse.status = true
            res.send(jsonResponse)
        }catch(err){
            console.log(err)
            res.status(500).send(err)
        }
    },
    //get all assets
    async getDevicesInAsset(req, res) {
        try{
            const asset = await Asset.doc(req.params.assetId).get()
            if(!asset.exists){
                return res.sendStatus(403) //Forbidden
            }
            const foundAsset = asset.data()
            if(foundAsset.ownerId !== req.userId){
                jsonResponse.message = `You don't have permission.`
                return res.status(403).send(jsonResponse)
            }
            console.log(req.params.assetId)
            const devices = await Device.where("assetId","==", req.params.assetId).get().then((querySnapshot) => {
                return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
            })
            return res.send(devices)
        }catch(err){
            console.log(err)
            res.status(500).send(err)
        }
    },
}