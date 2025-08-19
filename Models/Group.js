const { default: mongoose } = require("mongoose");



const GroupSchema = mongoose.model('group', {
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
        required: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        isAdmin: {
            type: Boolean,
            required: true
        },
        status: {
            type: String,
            required: true
        }
    }],
    type: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
})


module.exports=GroupSchema;