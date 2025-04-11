import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Dislike } from "../models/dislike.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const userId = req?.user?._id;
    const { videoId } = req.params;

    if (!userId) throw new ApiError(401, "Cannot find User ID");

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId).lean();
    if (!video) {
        throw new ApiError(
            404,
            "No video found with given videoId in database."
        );
    }

    let message = "";
    let updatedVideo = null;

    // Toggle logic
    const existingLike = await Like.findOne({
        likedBy: userId,
        video: videoId,
    });

    if (existingLike) {
        await existingLike.deleteOne();

        updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            { $pull: { likes: userId } },
            { new: true }
        );

        message = `Removed like from video: ${updatedVideo?.title || "unknown"}`;
    } else {
        // Check if the user has disliked the video, then remove dislike and then add like
        await Dislike.findOneAndDelete({
            dislikedBy: userId,
            video: videoId,
        });

        await Like.create({ likedBy: userId, video: videoId });

        updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            { $addToSet: { likes: userId }, $pull: { dislikes: userId } },
            { new: true }
        );

        message = `Liked the video: ${updatedVideo?.title || "unknown"}`;
    }

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update the video’s like list.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                `${message} | No. of likes: ${updatedVideo.likes?.length}`,
                updatedVideo
            )
        );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const userId = req?.user?._id;
    const { videoId } = req.params;
    const { commentId } = req.query;

    if (!userId) throw new ApiError(401, "Cannot find UserID");
    if (!commentId || !isValidObjectId(commentId))
        throw new ApiError(401, "Invalid Comment ID");
    if (!videoId || !isValidObjectId(videoId))
        throw new ApiError(401, "Invalid VideoID");

    const comment = await Comment.findById(commentId).populate("video");

    if (!comment || !comment.video._id.equals(videoId)) {
        throw new ApiError(
            400,
            "This comment does not exist for particular video"
        );
    }

    let like = await Like.findOneAndDelete({
        likedBy: userId,
        comment: commentId,
    });

    let message = "";

    if (like) {
        message = `Removed like from comment: ${comment.content} on video: ${comment.video.title}`;
    } else {
        // Remove the dislike from comment, if the user has already disliked the comment
        await Dislike.findOneAndDelete({
            dislikedBy: userId,
            comment: commentId,
        });

        like = await Like.create({
            likedBy: userId,
            comment: commentId,
        });

        message = `Added like to the comment: ${comment.content}  on video: ${comment.video.title}`;
    }

    if (!like) {
        throw new ApiError(500, "Error in updating likes on comment");
    }

    return res.status(200).json(new ApiResponse(200, message, like));
});

const toggleTweetLikes = asyncHandler(async (req, res) => {
    const userId = req?.user?._id;
    const { tweetId } = req.params;

    if (!userId) throw new ApiError(401, "Cannot find User ID");
    if (!tweetId || !isValidObjectId(tweetId))
        throw new ApiError(400, "Invalid Tweet ID");

    const tweetObjID = new mongoose.Types.ObjectId(tweetId);

    let like = await Like.findOneAndDelete({
        likedBy: userId,
        tweet: tweetObjID,
    }).populate('tweet');

    let message = ""
    if (like) {
        message = `Successfully removed like from tweet: ${like?.tweet?.content || "No Content"}`
    } else {
        // Check if the user has disliked the tweet, and if yes, remove that dislike and then like the tweet
        await Dislike.findOneAndDelete(
            {
                dislikedBy: userId,
                tweet: tweetObjID
            }
        )

        like = await Like.create({
            likedBy: userId,
            tweet: tweetObjID,
        });

        await like.populate('tweet')

        message = `Liked the tweet: ${like?.tweet?.content || "No Content"}`
    }

    if(!like){
        throw new ApiError(500, "Error in updating likes in the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, message, like))
});


export { toggleVideoLike, toggleCommentLike, toggleTweetLikes };
