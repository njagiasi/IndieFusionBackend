const { default: mongoose } = require("mongoose");
const NotificationSchema = require("../Models/Notifications");

const createNotification = async (notificationData) => {
    try {
        // Create a new notification document
        const notification = new NotificationSchema(notificationData);

        // Save the notification to the database
        const savedNotification = await notification.save();
        return savedNotification;
    } catch (error) {
        console.error("Error creating notification:", error.message);
        throw error;
    }
};

const markNotificationAsRead = async (req, res) => {
    const notificationId = req.params.notificationId;
    try {
        const updatedNotification = await NotificationSchema.findByIdAndUpdate(
            notificationId,
            { isRead: true }, // Update operation
            { new: true } // Return the updated document
        );
        return res.status(200).json({
            success: true,
            message: 'Notifications updated successfully',
            data: updatedNotification
        });
    } catch (error) {
        return res.status(200).json({
            success: true,
            message: 'Update notification failed',
            data: null
        });
    }
};

const getAllNotificationsByUserId = async (req, res) => {
    const id = req.params.id;

    try {
        const notifications = await NotificationSchema.aggregate([
            // Match notifications for the specified user
            { $match: { notificationTo: new mongoose.Types.ObjectId(id) } },

            // Lookup details for notificationFrom
            {
                $lookup: {
                    from: "users", // Replace with your actual User collection name
                    localField: "notificationFrom", // Field in NotificationSchema
                    foreignField: "_id", // Field in User collection
                    as: "fromUserDetails",
                },
            },
            {
                $unwind: {
                    path: "$fromUserDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Lookup details for notificationTo
            {
                $lookup: {
                    from: "users", // Replace with your actual User collection name
                    localField: "notificationTo", // Field in NotificationSchema
                    foreignField: "_id", // Field in User collection
                    as: "toUserDetails",
                },
            },
            {
                $unwind: {
                    path: "$toUserDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Lookup profile images for notificationFrom
            {
                $lookup: {
                    from: "profileimages", // Replace with your actual Profile Image collection name
                    localField: "notificationFrom", // Field in NotificationSchema
                    foreignField: "userId", // Field in Profile Image collection
                    as: "fromUserProfileImage",
                },
            },
            {
                $unwind: {
                    path: "$fromUserProfileImage",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Lookup profile images for notificationTo
            {
                $lookup: {
                    from: "profileimages", // Replace with your actual Profile Image collection name
                    localField: "notificationTo", // Field in NotificationSchema
                    foreignField: "userId", // Field in Profile Image collection
                    as: "toUserProfileImage",
                },
            },
            {
                $unwind: {
                    path: "$toUserProfileImage",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Sort notifications by createdDate in descending order
            { $sort: { createdDate: -1 } },
        ]);

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications.length ? notifications : [],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch notifications. Please try again later.",
            data: null,
        });
    }
};

module.exports = {
    createNotification,
    markNotificationAsRead,
    getAllNotificationsByUserId
}