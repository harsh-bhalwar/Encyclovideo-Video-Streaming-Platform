import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    // If user is unsubscribed to channel, then subscribe else unsubscribe
    const { channelId } = req.params;
    if (!channelId) {
        throw new ApiError(401, "Channel Id cannot be found");
    }
    // Check if channelID can be converted to ObjectID
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid Channel Id");
    }
    // Check if user is subscribed to channel
    const userId = req.user?._id;

    const subscription = await Subscription.findOne({
        subscriber: new mongoose.Types.ObjectId(userId),
        channel: new mongoose.Types.ObjectId(channelId),
    });

    if (subscription) {
        await Subscription.deleteOne({ _id: subscription?._id });
        return res
            .status(200)
            .json(new ApiResponse(200, "Channel Unsubscribed", subscription));
    }
    const newSubscription = await Subscription.create({
        subscriber: userId,
        channel: channelId,
    });

    return res.status(200).json(new ApiResponse(200, "Channel Subscribed", newSubscription));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if(!channelId){
        throw new ApiError(401, "ChannelID is not available");
    }
    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(401, "Invalid ChannelID")
    }
    const subscribers = await Subscription.aggregate(
        [
            {
                // Stage 1
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                // Stage 2
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriberDetails",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                email: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    username: "$subscriberDetails.username"
                }
            },
            {
                $project: {
                    subscriber: 1,
                    username: 1
                }
            }
        ]
    )
    
    return res
    .status(200)
    .json(new ApiResponse(200, "Successfully fetched the subscribers list", subscribers))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // We can get subscriber list of any user
    const { subscriberId } = req.params;

    if(!subscriberId){
        throw new ApiError(401, "Subscriber Id is not available");
    }
    if(!mongoose.isValidObjectId(subscriberId)){
        throw new ApiError(401, "Invalid Subscriber Id")
    }
    const subscribedChannels = await Subscription.aggregate(
        [
            {
                // Stage 1
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                // Stage 2
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channelDetails",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                email: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    channelName: "$channelDetails.username"
                }
            },
            {
                $project: {
                    subscriber: 1,
                    channel: 1,
                    channelName: 1,
                    channelDetails: 1
                }
            }
        ]
    )
    
    return res
    .status(200)
    .json(new ApiResponse(200, "Successfully fetched the subscribed channels list", subscribedChannels))
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
