import { Router } from "express";
import {createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, getUserPlaylists, getPlaylistById, deletePlaylist, updatePlaylist} from "../controllers/playlists.controllers.js"
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router()

// All routes are secured
router.use(verifyJWT)

router.route("/createPlaylist").post(upload.none(), createPlaylist)

router.route("/addVideo/:playlistId/:videoId").post(addVideoToPlaylist)

router.route("/removeVideo/:playlistId/:videoId").patch(removeVideoFromPlaylist)

router.route("/getUserPlaylists/:userId").get(getUserPlaylists)

router.route("/getPlaylistById/:playlistId").get(getPlaylistById)

router.route("/deletePlaylist/:playlistId").delete(deletePlaylist)

router.route("/updatePlaylist/:playlistId").patch(upload.none(), updatePlaylist)

export default router