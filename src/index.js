import dotenv from 'dotenv'
import dbConnect from './db/index.js';
import express from "express"

dotenv.config(
    {
        path: "./env"
    }
)
let PORT = process.env.PORT || 3000

const app = express();
// Since, async returns a promise
dbConnect()
.then(()=>{
    app.on("Error: ", (error)=>{
        console.log("Express is not able to connect to Database ", error)
    })

    app.listen(PORT, ()=>{
        console.log("App is listening on port "+PORT)
    })
})
.catch((error)=>{
    console.log("Database Connection FAILED "+error);
})




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