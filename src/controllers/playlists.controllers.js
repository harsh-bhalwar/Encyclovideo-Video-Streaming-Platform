import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlists.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const userId = req?.user?._id;
    const { name, description } = req.body;

    if (!userId) {
        throw new ApiError(401, "Invalid UserID");
    }
    if (!name) {
        throw new ApiError(400, "Name is required.");
    }

    // If playlist with the same name exists for same user, then throw an error;
    const existingPlaylist = await Playlist.findOne({
        name: name,
        owner: userId,
    });

    if (existingPlaylist) {
        throw new ApiError(
            400,
            "User has already created playlist with same name."
        );
    }

    const playlist = await Playlist.create({
        name: name,
        description: description,
        owner: userId,
    });

    if (!playlist) {
        throw new ApiError(500, "Cannot create playlist");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, "Successfully created playlist.", playlist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(401, "Invalid User ID");
    }
    const options = {
        page: Math.max(1, parseInt(page)) || 1,
        limit: Math.max(1, parseInt(limit)) || 10,
    };
    const aggregationPipeline = [
        {
            $match: {
                // Here userId is taken from params, so we have to convert it to ObjectID.
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $addFields: {
                noOfVideos: { $size: "$videos" },
            },
        },
        {
            $sort: { createdAt: -1 },
        },
    ];

    const paginatedPlaylists = await Playlist.aggregatePaginate(
        Playlist.aggregate(aggregationPipeline),
        options
    );

    if (!paginatedPlaylists) {
        throw new ApiError(500, "Error in paginating playlists.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Successfully get the playlists",
                paginatedPlaylists
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const { playlistId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id provided in parameters.");
    }

    // Aggregation Pipeline
    const pipeline = [
        // Stage-1
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) },
        },
        // Stage-2
        {
            $addFields: {
                noOfVideos: { $size: "$videos" },
            },
        },
        // Stage-3
        {
            $lookup: {
                from: "videos",
                let: { videoIds: "$videos" },
                pipeline: [
                    {
                        $match: { $expr: { $in: ["$_id", "$$videoIds"] } },
                    },
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            totalLikes: {
                                $size: "$likes",
                            },
                            totalDislikes: {
                                $size: "$dislikes",
                            },
                            views: 1,
                        },
                    },
                ],
                as: "videoDetails",
            },
        },
        {
            $sort: { createdAt: -1 },
        },
    ];

    const playlist = await Playlist.aggregate(pipeline);

    /*
    // This populates the videos array through mongoose 'populate' function
    // lean() makes it a plain JS object
    const playlist = await Playlist.findById(playlistId).populate("videos", ["-isPublished", "-_id"]).lean()

    if (!playlist) {
        throw new ApiError(500, "Cannot retrieve the playlist from database.");
    }

    // Add additional fields in each video document of playlist for No. of Likes and No. of Dislikes
    playlist.videos = playlist.videos.map((video) => (
        {
            ...video,
            noOfLikes: video.likes?.length,
            noOfDislikes: video.dislikes?.length
        }
    ))
*/
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Successfully retrieved the required playlist",
                playlist
            )
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const userId = req?.user?._id;
    // Take playlist ID and vide ID from parameters
    const { playlistId, videoId } = req.params;

    if (!userId) {
        throw new ApiError(401, "Invalid User ID");
    }
    // Check whether playlist Id is available and valid
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }
    // Check whether video Id is available and valid
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video ID");
    }

    // Find whether playlist with given playlist ID exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(400, "Cannot find playlist");

    // Find whether video with given videoID exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Invalid video ID");
    }

    // If the user requesting, is not the owner of the playlist, throw an error as only the owner of the playlist can add or remove videos from playlist.
    if (!playlist.owner.equals(userId)) {
        throw new ApiError(400, "The playlist does not belong to the user.");
    }

    // If the video already exists in the playlist, then throw an error.
    console.log(`Video ${video.title}' already exists in the playlist.`);
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(
            400,
            `Video ${video.title} already exists in the playlist.`
        );
    }

    try {
        // Push videoId to 'videos' array
        playlist.videos.push(videoId);
        await playlist.save();
    } catch (error) {
        throw new ApiError(500, "Cannot update playlist.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                `Video "${video.title}" successfully added to the playlist: ${playlist.name}`,
                playlist
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
    const userId = req?.user?._id;
    const { playlistId, videoId } = req.params;

    if (!userId) throw new ApiError(401, "Invalid User ID");
    if (!playlistId || !isValidObjectId(playlistId))
        throw new ApiError(400, "Invalid Playlist ID");
    if (!videoId || !isValidObjectId(videoId))
        throw new ApiError(400, "Invalid Video ID");

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId,
            },
        },
        {
            new: true,
        }
    );

    if (!playlist) {
        throw new ApiError(400, "Cannot find Playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Successfully removed video from playlist.",
                playlist
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { playlistId } = req.params;

    if (!userId) throw new ApiError(401, "User not authenticated");
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: userId,
    });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or not owned by the user");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            `Successfully deleted the playlist: ${playlist.name}`,
            playlist
        )
    );
});


const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist
    const userId = req?.user?._id;
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!userId) throw new ApiError(401, "Invalid User ID");
    if (!playlistId || !isValidObjectId(playlistId))
        throw new ApiError(400, "Invalid Playlist ID provided");
    if (!name?.trim()) throw new ApiError(400, "Name field cannot be empty");

    const updateFields = {
        name: name
    }

    if(description !== undefined){
        updateFields.description = description
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: userId,
        },
        {
            $set: updateFields
        },
        {
            new: true,
        }
    );

    if (!updatedPlaylist) {
        throw new ApiError(
            400,
            "The playlist with given playlist ID for user does not exist"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Successfully updated the playlist: " + updatedPlaylist.name,
                updatedPlaylist
            )
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
