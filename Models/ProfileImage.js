const { default: mongoose } = require("mongoose")

const ProfileImage = mongoose.model('profileImage', {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    imageUrl: String
})


module.exports = ProfileImage;