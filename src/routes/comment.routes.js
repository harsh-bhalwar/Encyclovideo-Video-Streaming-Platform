import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js"
import { addComment, updateComment, deleteComment, getVideoComments } from "../controllers/comment.controller.js";

const router = Router()

// All routes for comment must be secured
router.use(verifyJWT)

router.route("/addComment/:videoId").post(upload.none(), addComment)

router.route("/updateComment/:commentId").patch(upload.none(), updateComment)

router.route("/deleteComment/:commentId").delete(deleteComment)

router.route("/getVideoComments/:videoId").get(getVideoComments)

export  default router