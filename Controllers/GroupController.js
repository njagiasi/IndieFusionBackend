const { default: mongoose } = require("mongoose");
const GroupSchema = require("../Models/Group");
const { STATUS, NOTIFICATION_TYPES } = require("../utils/constants");
const { createNotification } = require("./NotificationsController");



const createGroup = (req, res) => {
    GroupSchema.findOne({ postId: req.body.post._id }).exec().then((post) => {
        if (!post) {
            const payload = {
                postId: req.body.post._id,
                members: [
                    {
                        userId: req.params.id,
                        isAdmin: true,
                        status: STATUS.APPROVED,
                    }
                ],
                type: req.body.type,
                isActive: true
            }
            const newGroup = new GroupSchema(payload);
            newGroup.save().then((newGroupResponse) => {
                if (newGroupResponse) {
                    return res.status(200).json({
                        success: 'Post creation successfull',
                        data: req.body.post
                    });
                } else {
                    return res.status(400).json({
                        success: 'Post creation failed',
                        data: null
                    });
                }
            }).catch((e) => {
                console.log(e);
                return res.status(500).json({
                    success: 'Something went worng while creating the post please try again later...!',
                    data: null
                });
            })

        } else {
            return res.status(404).json({
                success: 'Unable to find post and group creation failed',
                data: null
            });
        }
    }).catch((e) => {
        console.log("*******", e);
        return res.status(500).json({
            success: 'Something went worng while creating the post please try again later...!',
            data: null
        });
    })
}

const addMember = (req, res) => {
    GroupSchema.findOneAndUpdate(
        {
            postId: req.params.groupId,
            "members.userId": { $ne: req.params.id }
        },
        {
            $addToSet: {
                members: {
                    userId: req.params.id,
                    isAdmin: false,
                    status: STATUS.REQUESTED
                }
            }
        }, {
        new: true
    }
    ).exec().then((updatedGroup) => {
        if (updatedGroup?._id) {
            createNotification({
                notificationTo: updatedGroup?.members?.find((obj) => obj.isAdmin)?.userId,
                message: "has requested to join the group",
                notificationFrom: req.params.id,
                notificationType: NOTIFICATION_TYPES.GROUP,
                externalId: updatedGroup._id
            });
            return res.status(200).json({
                success: 'Member added successfully',
                data: updatedGroup
            });
        } else {
            return res.status(400).json({
                success: 'Member already exists',
                data: null
            });
        }
    }).catch((e) => {
        console.log(e);
        return res.status(500).json({
            success: 'Something went worng while adding the member please try again later...!',
            data: null
        });
    })
}

const removeMember = (req, res) => {

    const groupId = new mongoose.Types.ObjectId(req.params.groupId);
    const userId = new mongoose.Types.ObjectId(req.params.id);
    GroupSchema.findOneAndUpdate(
        {
            _id: groupId,
            "members.userId": userId// Ensure the member exists
        },
        {
            $pull: {
                members: { userId: userId } // Remove the member from the list
            }
        },
        {
            new: true // Return the updated document
        }
    ).exec().then((updatedGroup) => {
        if (updatedGroup) {
            const notifcationReceiver = updatedGroup?.members?.find((obj) => obj.isAdmin);
            if (notifcationReceiver) {
                createNotification({
                    notificationTo: notifcationReceiver?.userId,
                    message: "exited from the group", // User exited from the group
                    notificationFrom: req.params.id,
                    notificationType: NOTIFICATION_TYPES.GROUP,
                    externalId: req.params.groupId
                });
            }
            return res.status(200).json({
                success: "Member removed successfully",
                data: updatedGroup
            });
        } else {
            return res.status(400).json({
                success: "Member does not exist in the group",
                data: null
            });
        }
    })
        .catch((e) => {
            return res.status(500).json({
                success: "Something went wrong while removing the member, please try again later...!",
                data: null
            });
        });

}


const updateStatus = (req, res) => {
    GroupSchema.findOneAndUpdate(
        {
            _id: req.params.groupId,
            "members": {
                $elemMatch: {
                    userId: req.params.id,
                    isAdmin: true
                }

            },
            "members": {
                $elemMatch: {
                    userId: req.body.userId,
                    isAdmin: false
                }

            }

        },
        {
            $set: {
                "members.$": {
                    userId: req.body.userId,
                    isAdmin: false,
                    status: req.body.isApproved ? STATUS.APPROVED : STATUS.REJECTED
                }
            }
        }, {
        new: true
    }
    ).exec().then((updatedGroup) => {
        console.log(updatedGroup);
        if (updatedGroup?._id) {
            createNotification({
                notificationTo: req.body.userId,
                message: req.body.isApproved ? "approved your group request": "declined your group request", // User exited from the group
                notificationFrom: req.params.id,
                notificationType: NOTIFICATION_TYPES.GROUP,
                externalId: req.params.groupId
            });
            return res.status(200).json({
                success: `Member ${req.body.isApproved ? STATUS.APPROVED : STATUS.REJECTED}`,
                data: updatedGroup
            });
        } else {
            return res.status(400).json({
                success: 'Member not available',
                data: null
            });
        }
    }).catch((e) => {
        return res.status(500).json({
            success: 'Something went worng while approving the member please try again later...!',
            data: null
        });
    })
}

const getCurrentUserGroups = (req, res) => {
    const userId = req.params.id;

    GroupSchema.aggregate([
        {
            $match: {
                "members.userId": new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $unwind: "$members"
        },
        {
            $match: {
                "members.userId": new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "posts", // Collection name for posts
                localField: "postId",
                foreignField: "_id",
                as: "postDetails"
            }
        },
        {
            $unwind: "$postDetails"
        },
        {
            $lookup: {
                from: "users", // Collection name for users
                localField: "members.userId",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                _id: 0,
                groupId: "$_id",
                isActive: 1,
                postDetails: 1,
                userDetails: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    userName: 1,
                    email: 1,
                    type: 1
                },
                isAdmin: "$members.isAdmin",
                status: "$members.status"
            }
        }
    ])
        .then(result => {
            return res.status(200).json({
                success: `Group details fetched successfully`,
                data: result
            });
        })
        .catch(err => {
            return res.status(500).json({
                success: 'Unable to fetch group details... please try again later...!',
                data: null
            });
        });

}

const getCurrentUserGroupDetailsByGroupId = (req, res) => {
    const userId = req.params.id;
    const groupId = req.params.groupId;

    GroupSchema.aggregate([
        // Match the group by groupId
        { $match: { _id: new mongoose.Types.ObjectId(groupId) } },

        // Lookup post details
        {
            $lookup: {
                from: "posts",
                localField: "postId",
                foreignField: "_id",
                as: "postDetails",
            },
        },

        // Unwind post details (if necessary)
        { $unwind: { path: "$postDetails", preserveNullAndEmptyArrays: true } },

        // Lookup user details for the post's userId
        {
            $lookup: {
                from: "users",
                localField: "postDetails.userId",
                foreignField: "_id",
                as: "postUserDetails",
            },
        },

        // Unwind postUserDetails (optional, if you need a single user object)
        {
            $unwind: {
                path: "$postUserDetails",
                preserveNullAndEmptyArrays: true
            },
        },

        {
            $lookup: {
                from: "profileimages", // Note: Ensure the collection name matches
                localField: "postUserDetails._id",
                foreignField: "userId",
                as: "profileImageDetails",
            },
        },

        // Unwind profileImageDetails (optional, as there should be only one image per user)
        {
            $unwind: {
                path: "$profileImageDetails",
                preserveNullAndEmptyArrays: true,
            },
        },

        // Add profile image to the postUserDetails object
        {
            $addFields: {
                "postUserDetails.profileImage": "$profileImageDetails.imageUrl",
            },
        },

        // Lookup members' user details
        {
            $lookup: {
                from: "users",
                localField: "members.userId",
                foreignField: "_id",
                as: "userDetails",
            },
        },

        // Lookup profile images for members
        {
            $lookup: {
                from: "profileimages",
                localField: "members.userId",
                foreignField: "userId",
                as: "profileImages",
            },
        },

        // Transform members with user details and profile images
        {
            $addFields: {
                members: {
                    $map: {
                        input: "$members",
                        as: "member",
                        in: {
                            userId: "$$member.userId",
                            isAdmin: "$$member.isAdmin",
                            status: "$$member.status",
                            userDetails: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$userDetails",
                                            as: "user",
                                            cond: { $eq: ["$$user._id", "$$member.userId"] },
                                        },
                                    },
                                    0,
                                ],
                            },
                            profileImage: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$profileImages",
                                            as: "image",
                                            cond: { $eq: ["$$image.userId", "$$member.userId"] },
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                    },
                },
            },
        },

        // Check if the requested user is approved
        {
            $addFields: {
                requestedMember: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$members",
                                as: "member",
                                cond: { $eq: ["$$member.userId", new mongoose.Types.ObjectId(userId)] },
                            },
                        },
                        0,
                    ],
                },
            },
        },

        // Conditionally include members based on the requested user's status
        {
            $addFields: {
                members: {
                    $cond: {
                        if: { $eq: ["$requestedMember.status", STATUS.APPROVED] },
                        then: "$members",
                        else: [],
                    },
                },
            },
        },

        // Remove sensitive fields (like password) from userDetails
        {
            $project: {
                "members.userDetails.password": 0,
                "userDetails": 0,
                "profileImages": 0,
                "requestedMember.userDetails.password": 0,
                "postUserDetails.password": 0,
                "profileImageDetails": 0
            },
        },
    ]).then(result => {
        return res.status(200).json({
            success: `Group details fetched successfully`,
            data: result
        });
    })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                success: 'Unable to fetch group details... please try again later...!',
                data: null
            });
        });

}

const activateGroup = (req, res) => {

    const groupId = new mongoose.Types.ObjectId(req.params.groupId);
    const userId = new mongoose.Types.ObjectId(req.params.id);
    const isActive = req.params.isActive == 'true' ? true : false;
    GroupSchema.findOneAndUpdate(
        {
            _id: groupId,
            "members.userId": userId,
        },
        {
            isActive
        },
        {
            new: true // Return the updated document
        }
    ).exec().then((updatedGroup) => {
        console.log(updatedGroup);
        if (updatedGroup) {
            return res.status(200).json({
                success: `${isActive ? 'Group Activated successfully' : 'Group De-activated Successfully'}`,
                data: updatedGroup
            });
        } else {
            return res.status(400).json({
                success: `Unable to ${isActive ? 'Activated' : 'De-activated'} group`,
                data: null
            });
        }
    })
        .catch((e) => {
            return res.status(500).json({
                success: "Something went wrong while removing the member, please try again later...!",
                data: null
            });
        });

}

module.exports = {
    createGroup,
    addMember,
    updateStatus,
    getCurrentUserGroups,
    getCurrentUserGroupDetailsByGroupId,
    removeMember,
    activateGroup
}