import { Router } from "express";
import {
    userRegister,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controllers.js";
// Imported MULTER middleware to inject before the request goes to register the user
import upload from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    // Injecting middleware before the POST request goes to register user controller
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    userRegister
);

router.route("/login").post(upload.none(), loginUser);

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/getCurrentUser").get(verifyJWT, getCurrentUser);
router
    .route("/updateAccountDetails")
    .patch(verifyJWT, upload.none(), updateAccountDetails);
router
    .route("/updateAvatar")
    .post(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
    .route("/updateCoverImage")
    .post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
export default router;
