const { default: mongoose } = require("mongoose");

const Users=mongoose.model('users',
    {
        firstName:String,
        lastName:String,
        userName:String,
        email:String,
        password:String,
        type:String
    }
)

module.exports=Users;