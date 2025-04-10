import {Schema, model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String, // Cloudinary URL
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number, //Cloudinary url
            required : true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        category: {
            type: String,
            required: true
        },
        tags: [{
            type: String
        }],
        likes: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        dislikes: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }]
    }
, {timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model("Video", videoSchema)