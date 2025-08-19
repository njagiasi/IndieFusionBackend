const Users = require("../Models/Users");

const findUserInterceptor = (req, res, next) => {
    const id = req.params.id;
    Users.findById(id).exec().then((userExists) => {
        if (userExists) {
            next();
        } else {
            return res.status(401).json({
                success: 'Unauthorised User',
                data: null
            });
        }
    }).catch((e)=>{
        console.log(e);
        return res.status(500).json({
            success: 'Unauthorised User',
            data: null
        });
    })
}

module.exports={
    findUserInterceptor
}