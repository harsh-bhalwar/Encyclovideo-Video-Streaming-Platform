import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// If res is not used, it can be replaced as ' _ '
const verifyJWT = asyncHandler(async (req, _ , next) => {
    try {
        // Cookie-parser middleware add cookies() object in request which can be used to access the "accessToken" or in mobile apps take it from header.
        const accessToken = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ", "")
    
        if(!accessToken){
            throw new ApiError(401, "Unauthorized Request")
        }
        // Decode the JWT access token 
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid Access Token")
        }
        // Since, this is also a middleware it also adds an object in req which is "user", if the request have correct Access token it has access to the server.
        req.user = user;
        // When middleware is successfully executed, move to next function
        next()
    } catch (error) {
        throw new ApiError(401, error.message || "User is already Logged Out")
    }
})

export default verifyJWT;