import {Schema, model} from "mongoose"

const playlistSchema = new Schema(
    {
        videos: [{
            type: Schema.Types.ObjectId,
            ref: "Video"
        }],
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {timestamps: true}
)
export const Playlist = model("Playlist", playlistSchema);