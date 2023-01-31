const db = require('../../database');
const User = db.collection('users');
module.exports = {
    //get all user
    async index(req, res) {
        try {
            const users = await User.get().then((querySnapshot) => {
                return querySnapshot.docs.map(doc => Object.assign({ username: doc.get('username') }, { id: doc.id }))
            })
            res.send(users)
        } catch (err) {
            res.status(500).send(err)
        }
    },
    // create user
    async create(req, res) {
        try {
            const {username, password} = req.body
            if(!username || !password ) return res.status(400).json({'message': 'Username and password are required'})
            
            const duplicate = await User.where("username","==",username).get();
            if(!duplicate.empty) return res.sendStatus(409) // Conflict

            //encrypt the password
            const hashedPwd = await bcrypt.hash(password,10);
            //store the new user
            await User.add({"username": username, "password": hashedPwd, "refreshToken": [], "roles": {"User": 2001}});
            res.send({'success': `New user ${username} created!`})
        } catch (err) {
            res.status(500).send(err)
        }

    },
    // edit user, susspend active
    async put(req, res) {
        try{
            const user = await User.doc(req.params.userId).get()
            
            if(!user.exists){
                return res.status(403).send({
                    error: 'The user information was incorrect'
                })
            }

            await User.doc(req.params.userId).set(req.body)
            res.send(req.body)
        }catch(err){
            res.status(500).send(err)
        }
    },
    // delete user
    async remove(req, res) {
        try{
            const user = await User.doc(req.params.userId).get()
            
            if(!user.exists){
                return res.status(403).send({
                    error: 'The user information was incorrect'
                })
            }
            await User.doc(req.params.userId).delete()
            res.send({"username": user.data().username})
        }catch(err){
            return res.status(500).send(err)
        }
        //res.send(`Delete user : ${req.params.userId}`)
    },
    // show user
    async show(req, res) {
        try{
            const user = await User.doc(req.params.userId).get()
            
            if(!user.exists){
                return res.status(403).send({
                    error: 'The user information was incorrect'
                })
            }
            res.send(user.data())
        }catch(err){
            res.status(500).send(err)
        }
    }

}