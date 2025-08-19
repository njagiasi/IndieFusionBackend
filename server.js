const express = require('express');
const mongoose = require('mongoose');
const Users = require('./Models/Users');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { sendMail } = require('./mailer/mailer');
const { generatePassword } = require('./utils/password-generator');
const Profile = require('./Models/Profile');
const FileUpload = require('express-fileupload');
const ProfileImage = require('./Models/ProfileImage');
const fs = require('fs');
const { getProfileImage, updateProfileImage, deleteProfileImage } = require('./Controllers/Profie-Image-Upload-Controller');
const { getProfileDetails, updateProfileDetails } = require('./Controllers/ProfileController');
const { createPost, updatePost, deletePost, getPostById, getAllPosts, getAllPostsForAllUsers } = require('./Controllers/PostController');
const { findUserInterceptor } = require('./Controllers/UsersController');
const { addMember, updateStatus, getCurrentUserGroups, getCurrentUserGroupDetailsByGroupId, removeMember, activateGroup } = require('./Controllers/GroupController');
const { sendCollaborationRequest, getUserStatus, updateCollabStatus, getAllCollabsByUserId } = require('./Controllers/CollabsController');
const { getAllNotificationsByUserId, markNotificationAsRead } = require('./Controllers/NotificationsController');
const { getAllEvents, getEventById } = require('./Controllers/EventsController');
const { getFilteredUserDetails } = require('./Controllers/SearchController');
const app = express();
const port = 8080;
const saltRounds = 10;
const mongoURI = 'mongodb+srv://Indie_Fusion:indiefusion123@cluster0.lg87j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(__dirname + '/public'));
app.use(FileUpload());


mongoose.connect(mongoURI).then(() => {
    console.log("Connected to mongodb");
}).catch((e) => {
    console.log(e);
})


//Register or Users get and post
app.post('/register', async (req, res) => {
    try {
        const existingUser = await Users.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(200).json({
                success: 'User already exists',
                data: null
            });
        } else {
            const generatedPassword = generatePassword();
            const password = await bcrypt.hash(generatedPassword, saltRounds);
            const payload = {
                ...req.body,
                password: password
            }
            const messageBody = `Your new password for ${req.body?.email} is: <strong>${generatedPassword}</strong>`;
            sendMail(req.body?.email, 'Your password for the application', messageBody);
            const newUser = await new Users(payload).save();
            if (newUser) {
                newUser.password = undefined;
                return res.status(200).json({
                    success: 'User registered successfully',
                    data: newUser
                });
            } else {
                return res.status(400).json({
                    success: 'Unable to register user',
                    data: null
                });
            }
        }

    }
    catch (e) {
        return res.status(500).json({
            success: 'Something went worng. Please try again..',
            data: null
        });
    }
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const loginResult = await Users.findOne({ email: email });
        if (loginResult) {
            const storedHash = loginResult.password;
            const ismatch = await bcrypt.compare(password, storedHash);
            if (ismatch) {
                loginResult.password = undefined;
                return res.status(200).json({
                    success: 'Valid User',
                    data: loginResult
                });
            } else {
                return res.status(404).json({
                    message: 'Not a valid user',
                    data: null
                });
            }
        } else {
            return res.status(404).json({
                message: 'Not a valid user',
                data: null
            });
        }
    }
    catch (e) {
        return res.status(400).json({
            message: 'Something went wrong please try again ...',
            data: null
        });
    }


})

//Forgot Password get and post

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const forgotResult = await Users.findOne({ email: email }).exec();
        if (forgotResult) {
            const password = generatePassword();
            const newHashPassword = await bcrypt.hash(password, saltRounds);
            const passwordUpdated = await Users.findOneAndUpdate({ email: email }, { password: newHashPassword }).exec();
            if (passwordUpdated) {
                const messageBody = `Your new password for ${req.body?.email} is: <strong>${password}</strong>`;
                sendMail(email, 'Your new password for the application', messageBody);
                forgotResult.password = undefined;
                return res.status(200).json({
                    success: 'Password send to your email',
                    data: forgotResult
                });
            } else {
                return res.status(404).json({
                    message: 'Forgot password failed',
                    data: null
                });
            }

        } else {
            return res.status(404).json({
                message: 'Not a valid user',
                data: null
            });
        }
    } catch (e) {
        return res.status(400).json({
            message: 'Something went wrong please try again ...',
            data: null
        });
    }
})

//Reset Password get and post

app.post('/reset-password/:id', async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (oldPassword === newPassword) {
            return res.status(400).json({
                message: 'Old and new password cannot be same',
                data: null
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: 'New password  and confirm password does not match',
                data: null
            });
        }
        const userExist = await Users.findOne({ _id: req.params.id }).exec();
        if (userExist) {

            const isOldPasswordExist = await bcrypt.compare(oldPassword, userExist.password);
            if (isOldPasswordExist) {
                const confirmHashPassword = await bcrypt.hash(confirmPassword, saltRounds);

                const updatedUser = await Users.findByIdAndUpdate(req.params.id, { password: confirmHashPassword });
                if (updatedUser) {
                    updatedUser.password = undefined;
                    return res.status(200).json({
                        message: 'Reset password successfull',
                        data: updatedUser
                    });
                } else {
                    return res.status(500).json({
                        message: 'Something went wrong... Not able to update the user',
                        data: null
                    });
                }
            } else {
                return res.status(404).json({
                    message: 'User not found...',
                    data: null
                });
            }
        } else {
            return res.status(404).json({
                message: 'User not found...',
                data: null
            });
        }
    } catch (e) {
        return res.status(500).json({
            message: 'Something went wrong... Not able to update the user',
            data: null
        });
    }
})


// profile Details
app.get('/profile-update/:id', getProfileDetails)
app.put('/profile-update', updateProfileDetails)


// profile image
app.post('/profile-image-upload/:id', updateProfileImage)
app.get('/profile-image-upload/:id', getProfileImage)
app.delete('/profile-image-upload/:id', deleteProfileImage)


//post
app.get('/post/:id/:postId',findUserInterceptor,getPostById);
app.get('/post/:id',findUserInterceptor,getAllPosts);
app.post('/post/:id',findUserInterceptor, createPost);
app.put('/post/:id/:postId',findUserInterceptor,updatePost);
app.delete('/post/:id/:postId',findUserInterceptor,deletePost);

app.get('/post-dashboard/:id', findUserInterceptor, getAllPostsForAllUsers);

//Group or event

// app.post('/group/:id',findUserInterceptor,createGroup);


//Member 

app.put('/group/add-member/:id/:groupId',findUserInterceptor,addMember);
app.put('/group/update-status/:id/:groupId',findUserInterceptor,updateStatus);
app.put('/group/remove-member/:id/:groupId',findUserInterceptor,removeMember);
app.put('/group/activate/:id/:groupId/:isActive',findUserInterceptor,activateGroup);

app.get('/group/:id',findUserInterceptor,getCurrentUserGroups);
app.get('/group/:id/:groupId',findUserInterceptor,getCurrentUserGroupDetailsByGroupId);

app.post("/collab/:id/:requestedTo", findUserInterceptor, sendCollaborationRequest)
app.get("/collab/:id/:requestedTo", findUserInterceptor, getUserStatus);
app.put("/collab/:id/:requestedTo/:isApproved", findUserInterceptor, updateCollabStatus);
app.get("/collab/:id", findUserInterceptor, getAllCollabsByUserId);

app.get("/notifications/:id", findUserInterceptor, getAllNotificationsByUserId);
app.put("/notifications/:id/:notificationId", findUserInterceptor, markNotificationAsRead);

app.get("/post-event/:id", findUserInterceptor, getAllEvents);
app.get("/post-event/:id/:postId", findUserInterceptor, getEventById);


app.post("/search/:id/", findUserInterceptor, getFilteredUserDetails);


app.listen(port, () => {
    console.log('Listening to port 8080');
})