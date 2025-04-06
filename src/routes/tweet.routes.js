import { Router } from "express";
import { createTweet, updateTweet,  deleteTweet, getUserTweets} from "../controllers/tweet.controllers.js"
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router()
// All paths are secured for this
router.use(verifyJWT)

router.route("/createTweet").post(upload.none(), createTweet)

router.route("/updateTweet/:tweetId").patch(upload.none(), updateTweet)

router.route("/deleteTweet/:tweetId").delete(deleteTweet)

router.route("/getUserTweets").get(getUserTweets)

export default router