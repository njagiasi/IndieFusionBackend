const { default: mongoose } = require("mongoose");


const NotificationSchema = mongoose.model('notification', {
    notificationTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    notificationFrom:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    externalId: {
        type: String,
        default: ''
    },
    notificationType: {
        type: String,
        default: 'default'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        required: true
    },
    createdDate: {
        type: Date,
        default: Date.now, // Automatically set to the current date and time
    }
});

module.exports = NotificationSchema;