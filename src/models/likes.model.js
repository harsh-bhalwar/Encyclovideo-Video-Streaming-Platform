import {model, Schema} from "mongoose"

const likeSchema = new Schema(
    {
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        },
    },
    {timestamps: true}
)

// This checks that before saving the like document ensure that it is associated with sny video or any comment or any tweet
likeSchema.pre("validate", function(next){
    if(!this.video && !this.comment && !this.tweet){
        next(new Error("The dislike document must have atleast one video or one comment or one tweet"))
    } else{
        next()
    }
})

export const Like = model("Like", likeSchema)