import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {toggleVideoLike, toggleCommentLike, toggleTweetLikes} from "../controllers/like.controllers.js"

const router = Router()

// All paths to this API are secured
router.use(verifyJWT)

router.route("/toggleVideoLike/:videoId").post(toggleVideoLike)

router.route("/toggleCommentLike/:videoId").post(toggleCommentLike)

router.route("/toggleTweetLikes/:tweetId").post(toggleTweetLikes)

export default router