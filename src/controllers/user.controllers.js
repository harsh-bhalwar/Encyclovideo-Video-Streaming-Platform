import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponseError.js" 

const userRegister = asyncHandler( async (req, res) => {
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
    const {username, fullName, email, password} = req.body
    console.log(`Email: ${email} \nFull Name: ${fullName}\nUsername: ${username}`);

    // console.log("Request Body", req.body);
    

    // 2) Validate whether any of the fields is empty or not
    if(
        [username, fullName, email, password].some((field) => field.trim() === "")
    ){
        throw new ApiError(400, "Field should not be left empty")
    }
    
    // 3) Whether user exists

    // Checks whether user exists with given username OR email
    // const existingUser = User.findOne({
    //     $or : [{ username }, { email }]
    // })

    // To be more specific
    const existingUserWithEmail = await User.findOne({ email })
    const existingUserWithUsername = await User.findOne({ username })

    if(existingUserWithEmail) throw new ApiError(409, "The user with email already exists")
    if(existingUserWithUsername) throw new ApiError(409, "The user with username already exists")

    // Check for images and avatar
    // Multer middleware adds files information to request body which can be accessed using req.files (always use ?.)
    // Add await as file uploading takes time
    let coverImageLocalPath;
    
    // console.log("Request Files: ", req.files);
    // console.log("Request Files Avatar: ", req.files?.avatar[0]);
    
    
    // Check whether avatar exists, if not throw an error
    if(!req.files?.avatar){
        throw new ApiError(400, "Avatar Field is required")
    }
    if(req.files?.coverImage){
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }
    const avatarLocalPath =  req.files?.avatar[0]?.path

    // Upload on Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    

    if(!avatar){
        throw new Error(400, "Avatar Field is required")
    }

    // Create entry in database
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "", // Check whether cover images exists
        password: password
    })

    // Check whether the user is created or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // Remove password and refresh Token by using select(), add ' - ' before the field name that needs to be excluded
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user in the database")
    }

    return res.status(200).json(
        new ApiResponse(200, "User is succesfully registered", createdUser)
    )
})

export { userRegister }