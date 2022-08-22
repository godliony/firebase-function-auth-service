const jwt = require('jsonwebtoken')


module.exports = {
  async handleRefreshToken(req, res){
    const cookies = req.cookies
    if(!cookies?.jwt) return res.sendStatus(401);
    console.log(cookies.jwt);
    const refreshToken = cookies.jwt;
  
    const users = await User.where("refreshToken", "==", refreshToken).get().then((querySnapshot) => {
      return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
    });
    if (users.length <= 0) return res.sendStatus(403) // Unauthorized
  
    // evaluate jwt
    const user = users[0];
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err,decoded) => {
        if(err || user.username !== decoded.username) return res.sendStatus(403);
        const accessToken = jwt.sign(
          { "username": user.username },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: '1d' }
        )
        res.json({ accessToken})
      }
    )
  }
}