import { Router } from "express";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controllers.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

// All the subscription routes will be secure
router.route("/toggleSubscription/:channelId").post(verifyJWT, toggleSubscription)
router.route("/getSubscribers/:channelId").get(verifyJWT, getUserChannelSubscribers)
router.route("/getSubscribedChannels/:subscriberId").get(verifyJWT, getSubscribedChannels)

export default router