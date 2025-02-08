import { Router } from "express"
import { userRegister, loginUser, logoutUser } from "../controllers/user.controllers.js"
// Imported MULTER middleware to inject before the request goes to register the user
import upload from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    // Injecting middleware before the POST request goes to register user controller
    upload.fields([
        {
            name : "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    userRegister
)

router.route("/login").post(loginUser)

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)
export default router
