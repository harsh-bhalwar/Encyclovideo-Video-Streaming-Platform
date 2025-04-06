import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

const app = express();

app.use(
    cors({
        origin: process.env.ORIGIN,
        credentials: true,
    })
);
app.use(
    express.json({
        limit: "16kb",
    })
);
app.use(
    express.urlencoded({
        limit: "16kb",
    })
);
app.use(express.static("public"));
app.use(cookieParser());


// Importing Routes from user.routes.js
import userRouter from "./routes/user.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"

// Routes Declaration (Industry Grade)
app.use("/api/v1/user", userRouter)
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/comment", commentRouter)

export { app };
