import { Router } from "express";
import upload from "../middlewares/multer.middleware.js"
import {publishAVideo, getAllVideos, getVideoById, updateVideo, updateThumbnail, deleteVideo, togglePublishStatus} from "../controllers/video.controllers.js"
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router()
// Only logged in users can modify video

router.route("/publishVideo").post(
    verifyJWT,
    upload.fields([
        {
            name: "thumbnail",
            maxCount: 1
        },
        {
            name: "video",
            maxCount: 1
        }
    ]), 
    publishAVideo
)

router.route("/getAllVideos").get(verifyJWT, getAllVideos);

router.route("/getVideo/:videoId").get(verifyJWT, getVideoById);

router.route("/updateVideo/:videoId").patch(
    verifyJWT,
    upload.none(),
    updateVideo
)

router.route("/updateThumbnail/:videoId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateThumbnail
)

router.route("/deleteVideo/:videoId").delete(
    verifyJWT,
    deleteVideo
)

router.route("/togglePublishStatus/:videoId").patch(
    verifyJWT,
    togglePublishStatus
)
export default router;