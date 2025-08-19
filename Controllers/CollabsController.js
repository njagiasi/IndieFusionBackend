const { default: mongoose } = require("mongoose");
const CollabSchema = require("../Models/Collabs");
const { STATUS, NOTIFICATION_TYPES } = require("../utils/constants");
const { createNotification } = require("./NotificationsController");

// Function to send a collaboration request
const sendCollaborationRequest = async (req, res) => {
    const { id, requestedTo } = req.params;
    const { message } = req.body;
    try {
        // Create a new instance of the Collab model
        const collabRequest = new CollabSchema({
            userId: id,         // ID of the user sending the request
            requestedTo,    // ID of the user receiving the request
            message         // Message associated with the request
        });
        // Save the document to the database
        const savedCollabRequest = await collabRequest.save();
        createNotification({
            notificationTo: req.params.requestedTo,
            message: "sent you a collabaration request",
            notificationFrom: req.params.id,
            notificationType: NOTIFICATION_TYPES.COLLAB
        });
        return res.status(200).json({
            success: true,
            message: 'Collabration sent successfully ... ',
            data: savedCollabRequest
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Send collabration failed... Please try again',
            data: null
        });
    }
};


const getUserStatus = async (req, res) => {
    const userId = req.params.id;
    const requestedTo = req.params.requestedTo;
    try {
        const collabRequests = await CollabSchema.find({
            $or: [
                { requestedTo: requestedTo, userId: userId }, // Condition 1
                { requestedTo: userId, userId: requestedTo }  // Condition 2
            ]
        }).populate('requestedTo', '-password').populate('userId', '-password');
        return res.status(200).json({
            success: true,
            message: 'Fetched Collab Request',
            data: collabRequests
        });
    } catch (error) {
        console.error('Error fetching collaboration requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Fetched Collab Request',
            data: null
        });
    }
};


const updateCollabStatus = async (req, res) => {
    const userId = req.params.id; // Logged-in user ID
    const requestedTo = req.params.requestedTo; // Collaboration ID
    const isApproved = req.params.isApproved === 'true' ? true : false;
    
    try {
        // If not approved, remove the collaboration request
        if (!isApproved) {
            const deletedCollabRequest = await CollabSchema.findOneAndDelete({
                $or: [
                    { requestedTo: requestedTo, userId: userId }, // Condition 1
                    { requestedTo: userId, userId: requestedTo }  // Condition 2
                ]
            });

            if (deletedCollabRequest) {
                console.log('Collaboration request deleted:', deletedCollabRequest);
                createNotification({
                    notificationTo: req.params.requestedTo,
                    message: "declined your collab request",
                    notificationFrom: req.params.id,
                    notificationType: NOTIFICATION_TYPES.COLLAB
                });
                return res.status(200).json({
                    success: true,
                    message: 'Collaboration request removed',
                    data: deletedCollabRequest
                });
            } else {
                console.log('No collaboration request found matching the conditions for deletion.');
                return res.status(404).json({
                    success: false,
                    message: 'No collaboration request found matching the conditions for deletion.',
                    data: null
                });
            }
        } else {
            // If approved, update the status to APPROVED
            const updatedCollabRequest = await CollabSchema.findOneAndUpdate(
                {
                    $or: [
                        { requestedTo: requestedTo, userId: userId }, // Condition 1
                        { requestedTo: userId, userId: requestedTo }  // Condition 2
                    ]
                },
                { $set: { status: STATUS.APPROVED } }, // Update the status field
                { new: true } // Return the updated document
            );

            if (updatedCollabRequest) {
                console.log('Collaboration request updated:', updatedCollabRequest);
                createNotification({
                    notificationTo: req.params.requestedTo,
                    message: "accepted your collab request", // User exited from the group
                    notificationFrom: req.params.id,
                    notificationType: NOTIFICATION_TYPES.COLLAB
                });
                return res.status(200).json({
                    success: true,
                    message: 'Collaboration request approved',
                    data: updatedCollabRequest
                });
            } else {
                console.log('No collaboration request found matching the conditions.');
                return res.status(404).json({
                    success: false,
                    message: 'No collaboration request found matching the conditions.',
                    data: null
                });
            }
        }
    } catch (error) {
        console.error('Error processing collaboration request:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing collaboration request',
            data: null
        });
    }
};

const getAllCollabsByUserId = async (req, res) => {
    try {
        const requestId = req.params.id;
        const collabRequests = await CollabSchema.aggregate([
            {
                $match: {
                    $or: [
                        {
                            $and: [
                                { requestedTo: new mongoose.Types.ObjectId(requestId) }, // Match requestedTo field
                                {
                                    $or: [
                                        { status: STATUS.APPROVED },
                                        { status: STATUS.REQUESTED }
                                    ] // Match status field
                                }
                            ]
                        },
                        {
                            $and: [
                                { userId: new mongoose.Types.ObjectId(requestId) },
                                { status: STATUS.APPROVED }
                            ]
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users', // Lookup from the 'users' collection
                    localField: 'requestedTo', // Field in the collab schema
                    foreignField: '_id', // Match with _id field in the users collection
                    as: 'requestedToDetails'
                }
            },
            {
                $unwind: {
                    path: '$requestedToDetails',
                    preserveNullAndEmptyArrays: true // In case requestedToDetails is empty
                }
            },
            {
                $lookup: {
                    from: 'users', // Lookup from the 'users' collection
                    localField: 'userId', // Field in the collab schema
                    foreignField: '_id', // Match with _id field in the users collection
                    as: 'userDetails'
                }
            },
            {
                $unwind: {
                    path: '$userDetails',
                    preserveNullAndEmptyArrays: true // In case userDetails is empty
                }
            },
            {
                $lookup: {
                    from: 'profileimages', // Lookup from the 'profileimages' collection
                    localField: 'requestedTo', // Match requestedTo field with userId in profileImages
                    foreignField: 'userId',
                    as: 'requestedToProfileImage'
                }
            },
            {
                $unwind: {
                    path: '$requestedToProfileImage',
                    preserveNullAndEmptyArrays: true // In case requestedToDetails is empty
                }
            },

            {
                $addFields: {
                    "requestedToDetails.imageUrl": "$requestedToProfileImage.imageUrl",
                    "requestedToDetails.password": ""
                },
            },
            {
                $lookup: {
                    from: 'profileimages', // Lookup from the 'profileimages' collection
                    localField: 'userId', // Match userId field with userId in profileImages
                    foreignField: 'userId',
                    as: 'userProfileImage'
                }
            },
            {
                $unwind: {
                    path: '$userProfileImage',
                    preserveNullAndEmptyArrays: true // In case requestedToDetails is empty
                }
            },
            {
                $addFields: {
                    "userDetails.imageUrl": "$userProfileImage.imageUrl",
                    "userDetails.password": "",
                },
            },
            {
                $project: {
                    message: 1,
                    requestedDate: 1,
                    status: 1,
                    requestedTo: "$requestedToDetails",
                    userId: "$userDetails"
                }
            }
        ]);
        return res.status(200).json({
            success: true,
            message: 'Collaboration requests found',
            data: collabRequests
        });
    } catch (error) {
        console.error('Error fetching collaboration requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching collaboration requests',
            data: null
        });
    }
};

module.exports = {
    sendCollaborationRequest,
    getUserStatus,
    updateCollabStatus,
    getAllCollabsByUserId
}
