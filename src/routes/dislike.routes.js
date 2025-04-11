import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { toggleVideoDislike, toggleCommentDislike, toggleTweetDislikes} from "../controllers/dislike.controllers.js"; 

const router = Router()

// All paths to this API are secured
router.use(verifyJWT)

router.route("/toggleVideoDislike/:videoId").post(toggleVideoDislike)

router.route("/toggleCommentDislike/:videoId").post(toggleCommentDislike)

router.route("/toggleTweetDislikes/:tweetId").post(toggleTweetDislikes)

export default router