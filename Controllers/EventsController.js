const { default: mongoose } = require("mongoose");
const PostModel = require("../Models/Post");

const getAllEvents = async (req, res) => {

    try {
      
    const posts = await PostModel.aggregate([
        {
            $lookup: {
                from: 'users',               // Name of the 'users' collection
                localField: 'userId',         // Field in PostModel
                foreignField: '_id',          // Field in Users collection
                as: 'userDetails'             // Output array field for matched user documents
            }
        },
        {
            $lookup: {
                from: 'profileimages',        // Name of the 'profileimages' collection
                localField: 'userId',         // Field in PostModel
                foreignField: 'userId',       // Field in ProfileImage collection
                as: 'profileImageDetails'     // Output array field for matched profile images
            }
        },
        {
            $lookup: {
                from: 'profiles',             // Name of the 'profiles' collection
                localField: 'userId',         // Field in PostModel
                foreignField: 'userId',       // Field in Profile collection
                as: 'profileDetails'          // Output array field for matched profile documents
            }
        },
        {
            $unwind: {
                path: '$userDetails',         // Flatten the user details array
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: '$profileImageDetails', // Flatten the profile image details array
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: '$profileDetails',      // Flatten the profile details array
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                type: "EVENT"                 // Filter for documents with type === "EVENT"
            }
        },
        {
            $project: {
                mediaUrl: 1,
                text: 1,
                type: 1,
                title: 1,
                createdDate: 1,
                updatedDate: 1,
                startDate: 1,
                endDate: 1,
                isActive: '$profileDetails.isActive',
                openToCollab: '$profileDetails.openToCollab',
                'userDetails.firstName': 1,
                'userDetails.lastName': 1,
                'userDetails.userName': 1,
                'userDetails.email': 1,
                'userDetails.type': 1,
                'userId': 1,
                profileImageUrl: '$profileImageDetails.imageUrl'  // Rename field for simplicity
            }
        }
    ]);
        return res.status(200).json({
            success: true,
            message: 'Events found',
            data: posts
        });
    } catch (error) {
        console.error('Error fetching collaboration requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching collaboration requests',
            data: null
        });
    }   
}

const getEventById = async (req, res) => {
    try {
      
        const posts = await PostModel.aggregate([
            {
                $lookup: {
                    from: 'users',               // Name of the 'users' collection
                    localField: 'userId',         // Field in PostModel
                    foreignField: '_id',          // Field in Users collection
                    as: 'userDetails'             // Output array field for matched user documents
                }
            },
            {
                $lookup: {
                    from: 'profileimages',        // Name of the 'profileimages' collection
                    localField: 'userId',         // Field in PostModel
                    foreignField: 'userId',       // Field in ProfileImage collection
                    as: 'profileImageDetails'     // Output array field for matched profile images
                }
            },
            {
                $lookup: {
                    from: 'profiles',             // Name of the 'profiles' collection
                    localField: 'userId',         // Field in PostModel
                    foreignField: 'userId',       // Field in Profile collection
                    as: 'profileDetails'          // Output array field for matched profile documents
                }
            },
            {
                $unwind: {
                    path: '$userDetails',         // Flatten the user details array
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$profileImageDetails', // Flatten the profile image details array
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$profileDetails',      // Flatten the profile details array
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                        _id: new mongoose.Types.ObjectId(req.params.postId)         // Filter for documents with type === "EVENT"
                }
            },
            {
                $project: {
                    mediaUrl: 1,
                    text: 1,
                    type: 1,
                    title: 1,
                    createdDate: 1,
                    updatedDate: 1,
                    startDate: 1,
                    endDate: 1,
                    isActive: '$profileDetails.isActive',
                    openToCollab: '$profileDetails.openToCollab',
                    'userDetails.firstName': 1,
                    'userDetails.lastName': 1,
                    'userDetails.userName': 1,
                    'userDetails.email': 1,
                    'userDetails.type': 1,
                    'userId': 1,
                    profileImageUrl: '$profileImageDetails.imageUrl'  // Rename field for simplicity
                }
            }
        ]);
            return res.status(200).json({
                success: true,
                message: 'Events found',
                data: posts
            });
        } catch (error) {
            console.error('Error fetching collaboration requests:', error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching collaboration requests',
                data: null
            });
        } 
}

module.exports = {
    getAllEvents,
    getEventById
}