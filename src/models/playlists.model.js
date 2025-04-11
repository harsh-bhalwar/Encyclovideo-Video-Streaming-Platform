import {Schema, model} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
    {
        videos: [{
            type: Schema.Types.ObjectId,
            ref: "Video"
        }],
        name: {
            type: String,
            minlength: 3,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {timestamps: true}
)
playlistSchema.plugin(mongooseAggregatePaginate)
export const Playlist = model("Playlist", playlistSchema);