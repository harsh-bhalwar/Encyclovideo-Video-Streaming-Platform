import { isValidObjectId } from "mongoose";
import { Dislike } from "../models/dislike.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/likes.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoDislike = asyncHandler(async (req, res) => {
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
    const existingDislike = await Dislike.findOneAndDelete({
        dislikedBy: userId,
        video: videoId,
    });

    if (existingDislike) {
        updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            { $pull: { dislikes: userId } },
            { new: true }
        );

        message = `Removed dislike from video: ${updatedVideo?.title || "unknown"}`;
    } else {
        // Remove if the like, if the user has liked the video already and then dislike the video
        const existingLike = await Like.findOneAndDelete(
            {
                likedBy: userId,
                video: videoId
            }
        )

        await Dislike.create({ dislikedBy: userId, video: videoId });

        updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            { $addToSet: { dislikes: userId }, $pull: { likes: userId} },
            { new: true }
        );

        message = `Disliked the video: ${updatedVideo?.title || "unknown"}`;
    }

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update the video’s dislike list.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                `${message} | No. of dislikes: ${updatedVideo.dislikes?.length}`,
                updatedVideo
            )
        );
});

const toggleCommentDislike = asyncHandler(async (req, res) => {
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

    let dislike = await Dislike.findOneAndDelete({
        dislikedBy: userId,
        comment: commentId,
    });

    let message = "";

    if (dislike) {
        message = `Removed dislike from comment: ${comment?.content} on video: ${comment?.video.title}`;
    } else {
        // Remove the like from comment, if the user has already liked the comment
        await Like.findOneAndDelete({
            likedBy: userId,
            comment: commentId,
        });

        dislike = await Dislike.create({
            dislikedBy: userId,
            comment: commentId,
        });

        message = `Added dislike to the comment: ${comment?.content}  on video: ${comment?.video?.title}`;
    }

    if (!dislike) {
        throw new ApiError(500, "Error in updating dislikes on comment");
    }

    return res.status(200).json(new ApiResponse(200, message, dislike));
});

const toggleTweetDislikes = asyncHandler(async (req, res) => {
    const userId = req?.user?._id;
    const { tweetId } = req.params;

    if (!userId) throw new ApiError(401, "Cannot find User ID");
    if (!tweetId || !isValidObjectId(tweetId))
        throw new ApiError(400, "Invalid Tweet ID");

    const tweetObjID = new mongoose.Types.ObjectId(tweetId);

    let dislike = await Dislike.findOneAndDelete({
        dislikedBy: userId,
        tweet: tweetObjID,
    }).populate('tweet');

    let message = ""
    if (dislike) {
        message = `Successfully removed dislike from tweet: ${dislike?.tweet?.content || "No Content"}`
    } else {
        // Check if the user has liked the tweet, and if yes, remove that like and then dislike the tweet
        await Like.findOneAndDelete(
            {
                likedBy: userId,
                tweet: tweetObjID
            }
        )

        dislike = await Dislike.create({
            dislikedBy: userId,
            tweet: tweetObjID,
        });

        await dislike.populate('tweet')

        message = `Disliked the tweet: ${dislike?.tweet?.content || "No Content"}`
    }

    if(!dislike){
        throw new ApiError(500, "Error in updating dislikes in the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, message, dislike))
});

export { toggleVideoDislike, toggleCommentDislike, toggleTweetDislikes};
