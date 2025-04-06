import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10, sortType = "asc"} = req.query;

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }
    if(!["asc", "desc"].includes(sortType)){
        throw new ApiError(400, "Invalid sortType Value (Can be 'asc' or 'desc').")
    }
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const sortStage = {
        createdAt : sortType === "asc" ? 1 : -1
    }

    const aggregationPipeline = [
        { $match : { video: new mongoose.Types.ObjectId(videoId) } },
        { $sort: sortStage },
        {
            $project: {
                _id: 0,
                content: 1,
                owner: 1
            }
        }
    ]

    const paginatedComments = await Comment.aggregatePaginate(
        Comment.aggregate(aggregationPipeline), // This is fine too if the plugin is applied properly
        options
    );
    

    if(!paginatedComments){
        throw new ApiError(500, "Error in paginating the comments");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, `Successfully fetched comments \n Total Comments: ${paginatedComments.totalDocs}`, paginatedComments))
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const userId = req?.user?._id;
    const { videoId } = req.params;
    const { content } = req.body;

    if (!userId) {
        throw new ApiError(401, "Cannot find UserID");
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Incorrect Video ID");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Content cannot be empty");
    }

    try {
        const comment = await Comment.create({
            content: content,
            video: videoId,
            owner: userId,
        });

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    "Successfully wrote comment on Video",
                    comment
                )
            );
    } catch (error) {
        throw new ApiError(500, "Failed to create comment");
    }
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const userId = req?.user?._id;
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId || !isValidObjectId(commentId))
        throw new ApiError(400, "Invalid Comment ID");
    console.log(userId);

    if (!userId) {
        throw new ApiError(401, "Cannot find User ID");
    }
    if (!content?.trim()) throw new ApiError(400, "Comment cannot be empty.");

    const comment = await Comment.findById(commentId);

    if (!comment) throw new ApiError(404, "Cannot find comment");

    if (!comment.owner.equals(userId))
        throw new ApiError(
            403,
            "The comment does not belong to particular user"
        );

    try {
        comment.content = content;
        await comment.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, "Successfully updated content"));
    } catch (error) {
        throw new ApiError(500, "Failed to save the updated content");
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const userId = req?.user?._id;
    const { commentId } = req.params;

    if (!userId) throw new ApiError(401, "Cannot find User ID");
    if (!commentId || !isValidObjectId(commentId))
        throw new ApiError(400, "Invalid Comment ID");

    const deletedComment = await Comment.findOneAndDelete(
        {
            _id: commentId,
            owner: userId
        }
    )

    if(!deletedComment){
        throw new ApiError(403, "The particular user is not the owner of the comment");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Successfully Deleted Comment", deletedComment))
});

export { getVideoComments, addComment, updateComment, deleteComment };
