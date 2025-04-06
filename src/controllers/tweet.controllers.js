import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const userId = req?.user?._id
    const { content } = req.body

    if(!userId) throw new ApiError(401, "Cannot find User ID")
    if(!content?.trim()) throw new ApiError(400, "Content cannot be left empty")

    const tweet = await Tweet.create({
        owner: userId,
        content: content
    })

    if(!tweet){
        throw new ApiError(500, "Tweet cannot be created")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Successfully created tweet", tweet))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req?.user?._id
    const { page = 1, limit = 10, sortType = "asc"} = req.query

    if(!userId) throw new ApiError(401, "Cannot find UserID")
    if(!["asc", "desc"].includes(sortType)) throw new ApiError(400, "Invalid sortType value")

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const aggregationPipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: { "createdAt" : (sortType === "asc") ? 1 : -1}
        },
        {
            $project : {
                _id: 0,
                content: 1
            }
        }
    ]

    const paginatedTweets = await Tweet.aggregatePaginate(
        Tweet.aggregate(aggregationPipeline),
        options
    )

    if(!paginatedTweets){
        throw new ApiError(500, "Cannot find paginated tweets")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Successfully fetched tweets for the user. Total tweets: "+paginatedTweets.totalDocs, paginatedTweets))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const userId = req?.user?._id
    const { tweetId } = req.params
    const { content } = req.body;

    if(!userId) throw new ApiError(401, "Cannot find UserID")

    if(!tweetId || !isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet Id")

    if(!content?.trim()) throw new ApiError(400, "Content cannot be left empty")

    const tweet = await Tweet.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(tweetId),
            owner: new mongoose.Types.ObjectId(userId)
        },  
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!tweet){
        throw new ApiError(404, "The tweet does not belong to particular user.");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Successfully updated Tweet", tweet))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const userId = req?.user?._id
    const { tweetId } = req.params

    if(!userId) throw new ApiError(401, "Cannot find UserId")

    if(!tweetId || !isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet Id")

    const tweet = await Tweet.findOneAndDelete(
        {
            _id: new mongoose.Types.ObjectId(tweetId),
            owner: new mongoose.Types.ObjectId(userId)
        }
    )

    if(!tweet){
        throw new ApiError(404, "The tweet does not belong to particular user")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Successfully deleted tweet", tweet))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}