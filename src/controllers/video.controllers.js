import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    uploadVideoOnCloudinary,
    deleteImageFromCloudinary,
    deleteVideoFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "asc",
        userId,
    } = req.query;

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(401, "Provide User ID to get all videos.");
    }
    // console.log(`Page: ${page}, Limit: ${limit}, userID: ${userId}`);

    // Allowed sortinf fields
    const allowerdSortingValues = [
        "createdAt",
        "updatedAt",
        "likes",
        "dislikes",
        "views",
        "duration",
    ];

    if (!allowerdSortingValues.includes(sortBy)) {
        throw new ApiError(401, "SortBy Value is incorrect");
    }
    // Set options for pagination
    const options = {
        page: Number(page),
        limit: Number(limit),
    };
    // 'query' param is used to filter videos based on title, description, category, tags
    const matchStage = {
        $and: [
            query
                ? {
                      $or: [
                          {
                              title: {
                                  $regex: query,
                                  $options: "i" /* Case Insensitive */,
                              },
                          },
                          { description: { $regex: query, $options: "i" } },
                          { category: { $regex: query, $options: "i" } },
                          { tags: { $in: [new RegExp(query, "i")] } },
                      ],
                  }
                : {},
            { owner: new mongoose.Types.ObjectId(userId) },
        ],
    };

    // const sortStage = {
    //     [sortBy] : sortType === "asc" ? 1 : -1
    // }

    // To sort the videos based on no of likes, dislikes , we have to calculate the size of likes, dislikes array
    const aggregationPipeline = [
        { $match: matchStage },
        // To calculate the array size, add a field 'sortField' for likes and dislikes, else just add the sortBy v
        ...(["likes", "dislikes"].includes(sortBy)
            ? [
                  {
                      $addFields: {
                          sortField: { $size: `$${sortBy}` },
                      },
                  },
              ]
            : sortBy === "views"
              ? [
                    {
                        $addFields: {
                            sortField: "$views",
                        },
                    },
                ]
              : [
                    {
                        $addFields: {
                            sortField: `$${sortBy}`,
                        },
                    },
                ]),
        { $sort: { sortField: sortType === "asc" ? 1 : -1 } },
    ];

    const paginatedResults = await Video.aggregatePaginate(
        // Pass the aggregate cursor, so that mongoose has control over aggregation pipeline.
        Video.aggregate(aggregationPipeline),
        options
    );

    if (!paginatedResults) {
        throw new ApiError(401, "Error occured in pagination");
    }

    // console.log(`Page: ${page}, Limit: ${limit}, userID: ${userId}`);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Successfully Paginated Videos",
                paginatedResults
            )
        );
});

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description, category, tags } = req.body;

    // Check whether all details are available
    if (!(title && description && category)) {
        throw new ApiError(401, "Enter all details");
    }
    var tagsArray = [];
    if (tags) {
        tagsArray = tags.split(",").map((tag) => tag.trim());
        tagsArray = Array.from(new Set(tagsArray));
    }
    console.log(
        `Title: ${title}, Description: ${description}, Category: ${category}`
    );

    // Check for thubnail
    if (!req.files.thumbnail) {
        throw new ApiError(400, "Thumbnail is required.");
    }
    const thumbnailPath = req.files?.thumbnail[0]?.path;

    // Check for video
    if (!req.files.video) {
        throw new ApiError(400, "Video is required");
    }
    const videoPath = req.files?.video[0]?.path;

    // Check whether thumbnail is successfully uploaded on cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if (!thumbnail) {
        throw new ApiError(401, "Error in uploading thumbnail to cloudinary");
    }
    // console.log(thumbnail);

    // Check whether thumbnail is successfully uploaded on cloudinary
    const video = await uploadVideoOnCloudinary(videoPath);
    if (!video) {
        throw new ApiError(401, "Error in uploading video to cloudinary");
    }
    console.log(video);

    const userId = req.user?._id;
    // Create a Video Document for the video
    const publishedVideo = await Video.create({
        videoFile: video.secure_url,
        thumbnail: thumbnail.secure_url,
        title: title,
        description: description,
        owner: userId,
        category: category,
        tags: tagsArray,
        duration: video.duration,
        isPublished: true,
    });
    if (!publishedVideo) {
        throw new ApiError(400, "Error in creating a video document");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video has been successfully published",
                publishedVideo
            )
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(401, "Incorrect Video ID provided");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            email: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
    ]);

    if (!video) {
        throw new ApiError(401, "Error in fetch video details.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Succesfully fetched required video", video[0])
        );
});

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(401, "Incorrect VideoID in parameters");
    }
    const { title, description, tags, category } = req.body;

    if (!(title && description && tags && category)) {
        throw new ApiError(401, "Enter all details");
    }

    const tagsArray = Array.from(
        new Set(tags.split(",").map((tag) => tag.trim()))
    );
    const updatedVideo = await Video.findByIdAndUpdate(
        new mongoose.Types.ObjectId(videoId),
        {
            $set: {
                title: title,
                description: description,
                tags: tagsArray,
                category: category,
            },
        },
        {
            new: true,
        }
    );
    if (!updatedVideo) {
        throw new ApiError(401, "Error in updating video details");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Successfully updated Video Details",
                updatedVideo
            )
        );
});

const updateThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video ID");
    }

    const newThumbnailPath = req?.file?.path;
    if (!newThumbnailPath) {
        throw new ApiError(401, "Invalid Thumbnail");
    }

    const video = await Video.findById(videoId);

    if (!video) throw new ApiError(401, "Cannot fetch Video from MongoDB");

    const thumbnailURL = video.thumbnail;

    const updatedThumbnail = await uploadOnCloudinary(newThumbnailPath);

    if (!updatedThumbnail.secure_url) {
        throw new ApiError(
            401,
            "Error while uploading updated thumbnail on Cloudinary."
        );
    } else {
        await deleteImageFromCloudinary(thumbnailURL);
    }

    video.thumbnail = updatedThumbnail.secure_url;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "Thumbnail Updated Successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(401, "Error in finding video from MongoDB");
    }
    const thumbnailURL = video.thumbnail;
    const videoURL = video.videoFile;

    if (!(thumbnailURL && videoURL)) {
        throw new ApiError(401, "Cannot find thumbnail or video");
    }

    await deleteImageFromCloudinary(thumbnailURL);
    await deleteVideoFromCloudinary(videoURL);

    // console.log(
    //     "Successfully deleted thumbnail and video file from cloudinary"
    // );

    await Video.deleteOne({ _id: new mongoose.Types.ObjectId(videoId) });

    return res
        .status(200)
        .json(new ApiResponse(200, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Cannot find video with particular video Id");
    }

    const isPublished = video.isPublished;

    video.isPublished = !isPublished;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Succesfully Toggled Publish Status",
                video.isPublished
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    updateThumbnail,
    deleteVideo,
    togglePublishStatus,
};
