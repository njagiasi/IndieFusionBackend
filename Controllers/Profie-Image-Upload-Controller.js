const ProfileImage = require("../Models/ProfileImage");
const Users = require("../Models/Users");

const getProfileImage = (req, res) => {
    const id = req.params.id
    ProfileImage.findOne({ userId: id }).exec().then((profileImage) => {
        if (profileImage) {
            return res.status(200).json({
                message: 'Image fetched successfully',
                data: profileImage
            });
        } else {
            return res.status(200).json({
                message: 'Image not found',
                data: null
            });
        }
    }).catch((e) => {
        return res.status(500).json({
            message: 'Something went wrong please try again..!',
            data: null
        });
    })
}


const updateProfileImage=(req, res) => {
    const id = req.params.id;
    const imageRequest = req.files?.['profile-image'];
    if (!imageRequest) {
        return res.status(400).json({
            message: 'Image not found. Please upload a proper image',
            data: null
        });
    }
    Users.findById(id).exec().then((user) => {
        if (user) {
            const imageType = imageRequest.name.split('.')[1];
            const modifiedName = `${id}`;
            const imagePath = `public/profile-images/${modifiedName}.${imageType}`;

            ProfileImage.findOne({ userId: id }).exec().then((imageExists) => {
                if (imageExists) {
                    ProfileImage.findOneAndUpdate({ userId: id }, { $set: { imageUrl: imagePath } }).then((updatedImage) => {
                        if (updatedImage) {
                            // delete 
                            try {
                                fs.unlinkSync(imageExists.imageUrl);
                            } catch (e) {
                                console.log("image failed");
                            }

                            imageRequest.mv(imagePath, () => {
                            });
                            return res.status(200).json({
                                message: 'Image updated Successfully',
                                data: {
                                    url: imagePath
                                }
                            });
                        } else {
                            return res.status(500).json({
                                message: 'Something went wrong..Please try again...!',
                                data: {
                                    url: imagePath
                                }
                            });
                        }
                    }).catch((e) => {
                        console.log(e);
                    })
                } else {
                    const payload = {
                        userId: req.params.id,
                        imageUrl: imagePath
                    }
                    const profileImageUpload = new ProfileImage(payload);
                    profileImageUpload.save().then((result) => {
                        imageRequest.mv(imagePath, () => {
                        });
                        return res.status(200).json({
                            message: 'Image uploaded Successfully',
                            data: {
                                url: imagePath
                            }
                        });
                    })
                }
            })

        } else {
            return res.status(400).json({
                message: 'Image uploading Failed',
                data: null
            });
        }
    }).catch((e) => {
        return res.status(500).json({
            message: 'Something went wrong please try again..!',
            data: null
        });
    })
}

const deleteProfileImage=(req, res) => {
    ProfileImage.findOneAndDelete({ userId: req.params.id }).exec().then((deletedProfileImage) => {
        console.log(deletedProfileImage)
        if (deletedProfileImage) {
            try {
                fs.unlinkSync(deletedProfileImage.imageUrl);
            } catch (e) {
                console.log("image failed");
            }
            return res.status(200).json({
                message: 'Image deleted successfully',
                data: deletedProfileImage
            });
        }else{
            return res.status(400).json({
                message: "Image deletion failed",
                data: null
            });
        }
    }).catch((e) => {
        return res.status(500).json({
            message: 'Something went wrong please try again..!',
            data: null
        });
    })
}

module.exports = {
    getProfileImage,
    updateProfileImage,
    deleteProfileImage
}