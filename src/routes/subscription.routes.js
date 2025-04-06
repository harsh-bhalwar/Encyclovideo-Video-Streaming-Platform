import { Router } from "express";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controllers.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT)
// All the subscription routes will be secure
router.route("/toggleSubscription/:channelId").post(toggleSubscription)
router.route("/getSubscribers/:channelId").get(getUserChannelSubscribers)
router.route("/getSubscribedChannels/:subscriberId").get(getSubscribedChannels)

export default router