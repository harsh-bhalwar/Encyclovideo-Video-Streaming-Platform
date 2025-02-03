import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_USERNAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
    
const uploadOnCloudinary = async function(localFilePath){
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader
       .upload(
           localFilePath, 
           {
               resource_type: "auto",
           }
       )

    //    File Has Been Uploaded Successfuly
    console.log("File has been uploaded on Cloudinary Successfully\n Public URL: "+response.url);
    return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // Remove the locally saved file.
    }
}