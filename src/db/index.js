import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnect = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        console.log(
            "MongoDB Connection SUCCESSFULL:  " +
                connectionInstance.connection.host
        );
    } catch (error) {
        console.log("MongoDb Connection Error: " + error);
        process.exit(1);
    }
};

export default dbConnect;
