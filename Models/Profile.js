const { default: mongoose } = require("mongoose");

const Profile = mongoose.model('profile',
    {
        phoneNumber: String,
        address:String,
        city: String,
        state:String,
        country:String,
        skills: String,
        bio:String,
        gender: String,
        dob: String,
        interestedIn: String,
        openToCollab:{type: Boolean, default: true},
        isActive:{type: Boolean, default: true},
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        }
    })

module.exports = Profile;