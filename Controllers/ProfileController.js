const Profile = require("../Models/Profile");
const Users = require("../Models/Users");

const getProfileDetails=async (req, res) => {
    try {
        const user = await Users.findById(req.params.id).exec();
        const profile = await Profile.findOne({ userId: req.params.id }).exec();
        user.password = undefined;
        const obj = {
            user,
            profile
        }
        return res.status(200).json({
            message: 'Profile details fetched successfully',
            data: obj
        });
    } catch (e) {
        return res.status(500).json({
            message: "Something went wrong please try again...!",
            data: null
        });
    }
}

const updateProfileDetails=(req, res) => {
    const { firstName, lastName } = req.body.user
    Users.findByIdAndUpdate(req.body.profile.userId, { firstName, lastName }).then((updatedUser) => {
        if (updatedUser) {
            Profile.findOne({ userId: updatedUser._id }).then((profile) => {
                if (profile) {
                    Profile.findOneAndUpdate({ userId: req.body.profile.userId }, { $set: req.body.profile }).then((updatedProfile) => {
                        if (updatedProfile) {
                            return res.status(200).json({
                                message: 'Profile updated successfully',
                                data: req.body
                            });
                        }
                    }).catch((e) => {
                        return res.status(500).json({
                            message: 'Something went wrong... unable to update profile',
                            data: null
                        });
                    })
                } else {
                    const newProfile = new Profile(req.body.profile);
                    newProfile.save().then((savedProfile) => {
                        return res.status(200).json({
                            message: 'Profile updated successfully',
                            data: req.body
                        });
                    }).catch((e) => {
                        console.log(e);
                        return res.status(500).json({
                            message: 'Something went wrong... unable to save the profile',
                            data: null
                        });
                    })
                }
            }).catch((e) => {
                return res.status(500).json({
                    message: 'Something went wrong... Not able to update the user',
                    data: null
                });
            })
        }
    }).catch((e) => {
        return res.status(500).json({
            message: 'Something went wrong... Not able to get the user details',
            data: null
        });
    })

}

module.exports={
    getProfileDetails,
    updateProfileDetails
}