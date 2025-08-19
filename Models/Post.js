const { default: mongoose } = require("mongoose");

const PostModel = mongoose.model('post', {
    mediaUrl: {
        type: String
    },
    title: {
        type: String
    },
    text: {
        type: String
    },
    type: {
        type: String,
    },
    createdDate: {
        type: Date,
        default: Date.now()
    },
    updatedDate: {
        type: Date,
        default: Date.now()
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    startDate: {
        type: String
    },
    endDate: {
        type: String
    },
}
)

module.exports=PostModel