import {Schema, model} from "mongoose"
// Whenever a user subscribes a channel, a new "subscription" document is created.
const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, // One who is subscribing.
            ref: "User"
        },
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, 
    {timestamps: true})

export const Subscription = model("Subscription", subscriptionSchema);