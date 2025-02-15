import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Generate access and refresh token for any user by taking "user._id" as parameter
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // Add refresh token to user database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Error in generating Access and Refresh Tokens"
        );
    }
};

const userRegister = asyncHandler(async (req, res) => {
    // 1) Get user details from frontend (or Postman)
    // 2) Validate those details, whether any required field is not left empty
    // 3) Check whether the user already exists or not, using email and username ( Can check with either of them or both)
    // 4) Check for images and avatar
    // 5) Upload the avatar on Cloudinary and get the response URL (using Multer middleware)
    // 6) Create User object - create entry in Database
    // 7) Remove the password and refresh token from response
    // 8) Check for user creation
    // 9) Return response

    // 1)
    const { username, fullName, email, password } = req.body;
    console.log(
        `Email: ${email} \nFull Name: ${fullName}\nUsername: ${username}`
    );

    // console.log("Request Body", req.body);

    // 2) Validate whether any of the fields is empty or not
    if (
        [username, fullName, email, password].some(
            (field) => field.trim() === ""
        )
    ) {
        throw new ApiError(400, "Field should not be left empty");
    }

    // 3) Whether user exists

    // Checks whether user exists with given username OR email
    // const existingUser = User.findOne({
    //     $or : [{ username }, { email }]
    // })

    // To be more specific
    const existingUserWithEmail = await User.findOne({ email });
    const existingUserWithUsername = await User.findOne({ username });

    if (existingUserWithEmail)
        throw new ApiError(409, "The user with email already exists");
    if (existingUserWithUsername)
        throw new ApiError(409, "The user with username already exists");

    // Check for images and avatar
    // Multer middleware adds files information to request body which can be accessed using req.files (always use ?.)
    // Add await as file uploading takes time
    let coverImageLocalPath;

    console.log("Request Files: ", req.files);
    console.log("Request Files Avatar: ", req.files?.avatar[0]);

    // Check whether avatar exists, if not throw an error
    if (!req.files?.avatar) {
        throw new ApiError(400, "Avatar Field is required");
    }
    if (req.files?.coverImage) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // Upload on Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new Error(400, "Avatar Field is required");
    }

    // Create entry in database
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // Check whether cover images exists
        password: password,
    });

    // Check whether the user is created or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // Remove password and refresh Token by using select(), add ' - ' before the field name that needs to be excluded
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering user in the database"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "User is succesfully registered", createdUser)
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // Extract data from request
    // Check if any of the fileds is not empty
    // Check if the user with given email or username exists, if not route him to register
    // Verify the password, if correct send a Refresh and Access token, store refresh token in database

    const { username, email, password } = req.body;

    // When both username and email is required
    // if(!username && !email){
    //     throw new ApiError(400, "Username and email is required")
    // }
    // console.log(email);

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required");
    }

    // Check if the user exists
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Take access and refersh token from generateAccessAndRefreshToken() method
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    // Here the user refrence we have, has empty refresh token as generateAccessAndRefreshToken() method is called after the user is initialized. So we can either update the "user" object or make another database query (which can be expensive).

    const loggedInUser = await User.findById(user._id).select(
        " -password -refreshToken"
    );

    // Set options for cookie that ensures that cookie can only be modified by server
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User is successfully Logged In", {
                user: loggedInUser,
                accessToken,
                refreshToken,
            })
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // Since this method is called by a secure route, which means the "auth.middleware.js" has verified the Access Token and has added "user" object in req
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User is logged Out"));
});

// When the Access Token expires, we have to refresh it by verifying the Refresh Token send in request with Refresh Token that is stored in User database
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Extract Refresh Token from req.body or req.header (in case of mobile apps)
    try {
        const incomingRefreshToken =
            req.cookies?.refreshToken || req.header?.refreshToken;
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized Request");
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        console.log(decodedToken);

        const user = await User.findById(decodedToken?._id);

        console.log(user);

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        // We have to verify, whether the incoming decoded Refresh Token and Refresh Token stored in database are same

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used");
        }

        const { newAccessToken, newRefreshToken } =
            await generateAccessAndRefreshToken(user?._id);

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    "Refresh Token and Access Token are successfully refreshed",
                    {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                    }
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // If the user can change password, that means he is already logged in
    const { currentPassword, newPassword } = req.body;

    if (!req.user || !req.user._id) {
        throw new ApiError(400, "User ID is missing from request");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    console.log(user);

    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "Password Changed Successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, "User fetched Succesffully", req.user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(401, "Error in finding avatar local path");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(401, "Error whiile uploading avatar on cloudinary");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url },
        },
        { new: true }
    ).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(401, "User does not exist");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Avatar Update Successfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(401, "Error in finding cover image local path");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(
            401,
            "Error whiile uploading cover image on cloudinary"
        );
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImage.url },
        },
        { new: true }
    ).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(401, "User does not exist");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Cover Image Updated Successfully", user));
});

const getUserChannelDetails = asyncHandler(async (req, res) => {
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "Username not found!");
    }
    // Create an aggregation pipeline that looks up how many subscribers does the channel have, if you are subscribed to that channel or not
    const channel = await User.aggregate(
        [   // Stage1: We match the document where username = given username
            {
                $match : {
                    username : username.toLowerCase()
                }
            },
            // Stage 2: Looks up the subsctibers of the channel
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "channel",
                    as : "subscribers"
                }
            },
            // Stage 3: Looks up how many channels have the username subscribed to
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "subscriber",
                    as : "subscribedTo"
                }
            },
            // Stage 4: Add Field of Total Subscribers to the document
            {
                $addFields : {
                    subscribersCount : {
                        $size : "$subscribers"
                    },
                    channelsSubscribedTo : {
                        $size : "$subscribedTo"
                    },
                    isSubscribedTo : {
                        $cond : {
                            if : { $in : [req.user?._id, "$subscribers.subscriber"]},
                            then : true,
                            else : false
                        }
                    }
                }
            },
            // Stage 5: Project what fields to display in output
            {
                $project : {
                    username : 1,
                    email : 1,
                    fullName : 1,
                    avatar : 1,
                    coverImage : 1,
                    subscribersCount : 1,
                    channelsSubscribedTo : 1,
                    isSubscribedTo : 1
                }
            }
        ]
    );

    console.log(channel);
    if(!channel?.length){
        throw new ApiError(401, "The channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Channel Value Fetched", channel[0])
    )
    
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate(
        [
            //Stage1: Filter the logged in user document
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "watchHistory",
                    foreignField : "_id",
                    as : "watchHistory",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner",
                                pipeline : [
                                    {
                                        $project : {
                                            username : 1,
                                            avatar : 1,
                                            fullName : 1,
                                            email : 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )

    if(!user){
        throw new ApiError(401, "Cannot find user watch history")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "User History Fetched Successfully", user[0].watchHistory)
    )
})

export {
    userRegister,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelDetails,
    getUserWatchHistory
};
