const { v4: uuid } = require("uuid");
const PostModel = require("../Models/Post");
const fs = require('fs');
const ProfileImage = require("../Models/ProfileImage");
const { createGroup } = require("./GroupController");
const { POST_TYPES } = require("../utils/constants");
const GroupSchema = require("../Models/Group");
const Profile = require("../Models/Profile");
const Users = require("../Models/Users");


const createPost = (req, res) => {
    const { text, type, title = '', startDate, endDate } = req.body
    const userId = req.params.id;
    const imageRequest = req.files?.media;
    if (!imageRequest && !text) {
        return res.status(400).json({
            success: 'Bad request...No data available',
            data: null
        });
    }
    let path = '';
    if (imageRequest) {
        const imageUuid = uuid();
        const url = `${userId}_${imageUuid}`;
        const splittedFileName = imageRequest.name.split('.');
        const mediaExtension = imageRequest.name.split('.')[splittedFileName.length - 1];
        path = `public/posts/${url}.${mediaExtension}`;
        imageRequest.mv(path, () => {
        });
    }

    const payload = {
        mediaUrl: path,
        text,
        type,
        userId,
        title,
        startDate,
        endDate
    }
    const newPost = new PostModel(payload);
    newPost.save().then((newPostResponse) => {
        if (newPostResponse) {
            if (type.toUpperCase() == POST_TYPES.SELF || type.toUpperCase() == POST_TYPES.EVENT) {
                return res.status(200).json({
                    success: 'Post created successfully',
                    data: newPostResponse
                });
            } else {
                req.body = {
                    type,
                    post: newPostResponse
                }
                createGroup(req, res);
            }

        } else {
            try {
                fs.unlinkSync(path);
                return res.status(400).json({
                    success: 'Post created failed',
                    data: null
                });
            } catch (e) {
                console.log("Image deletion failed");
            }

        }
    }).catch((e) => {
        console.log(e);
        return res.status(500).json({
            success: 'Something went wrong..Please try again..!',
            data: null
        });
    })
}


const updatePost = (req, res) => {
    const postId = req.params.postId;
    const { text, title = '', startDate, endDate } = req.body;
    PostModel.findByIdAndUpdate(postId, { text, title, startDate, endDate }).exec().then((postUpdated) => {
        if (postUpdated) {
            return res.status(200).json({
                success: "Posted updated successfully",
                data: postUpdated
            });
        } else {
            return res.status(400).json({
                success: "Posted updation failed",
                data: null
            });
        }
    }).catch((e) => {
        console.log(e);
        return res.status(400).json({
            success: "Something went wrong..Please try again later...!",
            data: null
        });
    })
}


const getPostById = (req, res) => {
    postId = req.params.postId;
    PostModel.findById(postId).exec().then((getPostById) => {
        if (getPostById) {
            return res.status(200).json({
                success: "",
                data: getPostById
            });
        } else {
            return res.status(400).json({
                success: "Post not available",
                data: null
            });
        }
    }).catch((e) => {
        return res.status(500).json({
            success: "Something went wrong..Please try again later...!",
            data: null
        });
    })
}

const getAllPosts = (req, res) => {
    id = req.params.id;
    Promise.all([
        // Fetch all posts by the user with type SELF and populate user details
        PostModel.find({ userId: id, type: POST_TYPES.SELF }).populate([
            {
                path: "userId",
                select: "-password",
            },
        ]),
        // Fetch the user's profile image
        ProfileImage.findOne({ userId: id }),
        // Fetch the user's profile details (including isActive and openToCollab)
        Profile.findOne({ userId: id }, "isActive openToCollab bio"),
        Users.findOne({ _id: id }, "firstName lastName userName")

    ])
        .then(([getAllPosts, imageData, profileDetails, userDetails]) => {
            if (getAllPosts) {
                return res.status(200).json({
                    success: "User details fetched successfully",
                    data: {
                        posts: getAllPosts, // Post data
                        imageUrl: imageData?.imageUrl || null, // Profile image URL
                        profileDetails: profileDetails || null, // Profile details (isActive and openToCollab)
                        userDetails: userDetails || null
                    },
                });
            } else {
                return res.status(400).json({
                    success: "No post available",
                    data: null,
                });
            }
        })
        .catch((e) => {
            console.error(e);
            return res.status(500).json({
                success: "Something went wrong..Please try again later...!",
                data: null,
            });
        });
}

const deletePost = async (req, res) => {
    postId = req.params.postId;
    const post = await PostModel.findById(postId);
    if (!post) {
        return res.status(400).json({
            success: "Post not found",
            data: null
        });
    }

    const { type } = post;
    PostModel.findByIdAndDelete(postId).exec().then(async (deletedPost) => {
        if (deletedPost) {
            if (deletedPost.mediaUrl) {
                try {
                    fs.unlinkSync(deletedPost.mediaUrl)
                } catch {
                    console.log("Deletion failed");
                }
            }
            if (type === POST_TYPES.COLLAB || type === POST_TYPES.EVENT) {
                const group = await GroupSchema.findOne({ postId });
                if (group) {
                    await GroupSchema.findOneAndDelete({ postId });
                    return res.status(200).json({
                        success: `Group deleted successfully.`,
                        data: group
                    });
                } else {
                    return res.status(400).json({
                        success: `Group with Post ID not found`,
                        data: null
                    });
                }
            }
            return res.status(200).json({
                success: "Post deletion successfully",
                data: deletedPost
            });
        } else {
            return res.status(400).json({
                success: "Post deletion failed",
                data: null
            });
        }
    }).catch((e) => {
        return res.status(500).json({
            success: "Something went wrong..Please try again later...!",
            data: null
        });
    })
}

const getAllPostsForAllUsers = (req, res) => {
    PostModel.aggregate([
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
                from: 'profiles',        // Name of the 'profileimages' collection
                localField: 'userId',         // Field in PostModel
                foreignField: 'userId',       // Field in ProfileImage collection
                as: 'profileDetails'     // Output array field for matched profile images
            }
        },
        {
            $lookup: {
                from: 'groups',               // Name of the 'users' collection
                localField: '_id',         // Field in PostModel
                foreignField: 'postId',          // Field in Users collection
                as: 'groupDetails'             // Output array field for matched user documents
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
                path: '$profileDetails', // Flatten the profile image details array
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: '$groupDetails',         // Flatten the user details array
                preserveNullAndEmptyArrays: true
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
                isGroupActive: '$groupDetails.isActive',
                isActive: '$profileDetails.isActive',
                openToCollab: '$profileDetails.openToCollab',
                "members": "$groupDetails.members",
                'userDetails.firstName': 1,
                'userDetails.lastName': 1,
                'userDetails.userName': 1,
                'userDetails.email': 1,
                'userDetails.type': 1,
                'userId': 1,
                profileImageUrl: '$profileImageDetails.imageUrl'  // Rename field for simplicity
            }
        }
    ])
        .then(posts => {
            if (posts) {
                return res.status(200).json({
                    success: "Successfully fetched",
                    data: posts
                });
            } else {
                return res.status(404).json({
                    success: "Not able to get the posts. Please try again",
                    data: null
                });
            }

        })
        .catch(err => {
            return res.status(500).json({
                success: 'Something went wrong..Please try again..!',
                data: posts
            });
        });

}

module.exports = {
    createPost,
    updatePost,
    deletePost,
    getPostById,
    getAllPosts,
    getAllPostsForAllUsers
}