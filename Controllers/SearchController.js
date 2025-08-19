const Profile = require("../Models/Profile");

const getFilteredUserDetails = async (req, res) => {
    const {searchTerm, country, state} = req.body;
    try {
        const regexSearchTerm = new RegExp(searchTerm, "i"); // Case-insensitive regex

        const results = await Profile.aggregate([
            // 1. Lookup user details
            {
                $lookup: {
                    from: "users", // Collection name for 'users'
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            // 2. Unwind userDetails to deconstruct the array
            {
                $unwind: "$userDetails",
            },
            // 3. Lookup profile image details
            {
                $lookup: {
                    from: "profileimages", // Collection name for 'profileImage'
                    localField: "userId",
                    foreignField: "userId",
                    as: "profileImage",
                },
            },
            // 4. Unwind profileImage (optional)
            {
                $unwind: {
                    path: "$profileImage",
                    preserveNullAndEmptyArrays: true, // Keep results even if no profile image exists
                },
            },
            // 5. Match the searchTerm and optional filters (country, state)
            {
                $match: {
                    $and: [
                        // Search term match on any of the specified fields
                        {
                            $or: [
                                { "userDetails.userName": regexSearchTerm },
                                { "userDetails.firstName": regexSearchTerm },
                                { "userDetails.lastName": regexSearchTerm },
                                { skills: regexSearchTerm },
                                { "userDetails.email": regexSearchTerm },
                            ],
                        },
                        // Country filter (if provided)
                        ...(country ? [{ country: country }] : []),
                        // State filter (if provided)
                        ...(state ? [{ state: state }] : []),
                    ],
                },
            },
            // 6. Project the fields you want in the output
            {
                $project: {
                    _id: 1,
                    phoneNumber: 1,
                    address: 1,
                    city: 1,
                    state: 1,
                    country: 1,
                    skills: 1,
                    bio: 1,
                    gender: 1,
                    dob: 1,
                    interestedIn: 1,
                    openToCollab: 1,
                    isActive: 1,
                    "userDetails.firstName": 1,
                    "userDetails.lastName": 1,
                    "userDetails.userName": 1,
                    "userDetails.email": 1,
                    "profileImage.imageUrl": 1,
                    "userDetails._id": 1
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            message: 'Search found',
            data: results
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching search requests',
            data: null
        });
    }
};

module.exports = {
    getFilteredUserDetails
}
