import dotenv from 'dotenv'
import dbConnect from './db/index.js';

dotenv.config(
    {
        path: "./env"
    }
)

dbConnect();




// This approach populates the index.js file, instead write modular code in DB folder
/*  
const app = express();

;( async ()=> {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("Error: ", (error)=>{
            console.log("Express is not able to connect to database");
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("Error: "+error);
        throw new error;
    }
})()

*/