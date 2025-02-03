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

// Routes Declaration (Industry Grade)
app.use("/api/v1/user", userRouter)

export { app };
