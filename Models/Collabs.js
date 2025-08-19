const { default: mongoose } = require("mongoose");
const { STATUS } = require("../utils/constants");


const CollabSchema = mongoose.model('collab', {
    requestedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    requestedDate: {
        type: Date,
        default: Date.now()
    },
    status: {
        type: String,
        default: STATUS.REQUESTED
    }
});

module.exports = CollabSchema;