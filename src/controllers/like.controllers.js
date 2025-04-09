import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { app } from "../app.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const userId = req?.user?._id;
    const { videoId } = req.params;

    if (!userId) throw new ApiError(401, "Cannot find User ID");
    if (!videoId || !isValidObjectId(videoId))
        throw new ApiError(400, "Cannot find Video ID");

    const userObjId = new mongoose.Types.ObjectId(userId);
    const videoObjId = new mongoose.Types.ObjectId(videoId);

    try {
        const deletedLike = await Like.findOneAndDelete({
            likedBy: userObjId,
            video: videoObjId,
        });

        if (deletedLike) {
            const updatedVideo = await Video.findByIdAndUpdate(
                videoId,
                {
                    $pull: {
                        likes: userId,
                    },
                },
                {
                    new: true,
                }
            );

            return res
                .status(200) // Correct status code for successful unlike
                .json(
                    new ApiResponse(
                        200,
                        "Successfully unliked the video with title: " +
                            updatedVideo.title,
                        deletedLike
                    )
                );
        } else {
            await Like.create({
                likedBy: userObjId,
                video: videoObjId,
            });

            const video = await Video.findByIdAndUpdate(
                videoId,
                {
                    $addToSet: { likes: userId },
                },
                {
                    new: true,
                }
            );

            return res
                .status(200) // Correct status code for successful like
                .json(
                    new ApiResponse(
                        200,
                        "Liked the video with title: " + video.title
                    )
                );
        }
    } catch (error) {
        throw new ApiError(500, "Internal Server Error");
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const userId = req?.user?._id
    const { videoId } = req.params
    const { commentId } = req.query

    console.log(userId+"\n"+videoId+"\n"+commentId);
    

    if(!userId) throw new ApiError(401, "Cannot find UserID")
    if(!commentId || !isValidObjectId(commentId)) throw new ApiError(401, "Invalid Comment ID")
    if(!videoId || !isValidObjectId(videoId)) throw new ApiError(401, "Invalid VideoID")

    const userObjId = new mongoose.Types.ObjectId(userId)
    const vidObjId = new mongoose.Types.ObjectId(videoId)
    const comObjId = new mongoose.Types.ObjectId(commentId)

    const comment = await Comment.findById(comObjId)

    if(!comment || !comment.video.equals(vidObjId)){
        throw new ApiError(400, "Incorrect Comment ID");
    }

    const deletedLike = await Like.findOneAndDelete(
        {
            likedBy: userObjId,
            comment: comObjId
        }
    )

    try {
        if(deletedLike){
            return res
            .status(200)
            .json(new ApiResponse(200, "Successfully deleted like", deletedLike))
        } else {
            const like = Like.create({
                likedBy: userObjId,
                comment: comObjId
            })

            return res
            .status(200)
            .json(new ApiResponse(200, "Succesfully liked the comment", like))
        }

    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

const toggleTweetLikes = asyncHandler(async (req, res) => {
    const userId = req?.user?._id
    const { tweetId } = req.params

    if(!userId) throw new ApiError(401, "Cannot find User ID")
    if(!tweetId || !isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet ID")

    const userObjID = new mongoose.Types.ObjectId(userId)
    const tweetObjID = new mongoose.Types.ObjectId(tweetId)

    const deletedLike = await Like.findOneAndDelete(
        {
            likedBy: userObjID,
            tweet: tweetObjID
        }
    )

    try {
        if(deletedLike){
            return res
            .status(200)
            .json(new ApiResponse(200, "Successfully deleted like", deletedLike))
        } else {

            const like = await Like.create({
                likedBy: userObjID,
                tweet: tweetObjID
            })

            const updatedLike = await Like.findById(like._id).populate('tweet')

            return res
            .status(200)
            .json(new ApiResponse(200, "Succesfully liked the tweet: "+updatedLike.tweet.content, updatedLike))
        }

    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})
export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLikes
}