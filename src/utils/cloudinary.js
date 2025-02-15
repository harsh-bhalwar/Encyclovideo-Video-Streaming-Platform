import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_USERNAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (localFilePath) {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        //    File Has Been Uploaded Successfuly
        // console.log(
        //     "File has been uploaded on Cloudinary Successfully\n Public URL: " +
        //         response.url
        // );

        // If the image is succesfully uploaded remove it from local path
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // Remove the locally saved file.
    }
};

const getPublicId = function(url){
    return url.split('/').slice(-1)[0].split('.')[0];
}

const deleteAssetFromCloudinary = async function(publicID){
    try {
        const result = await cloudinary.uploader.destroy(publicID);
        console.log("Result : ", result);
    } catch (error) {
        console.log(error.message || "Error in deleting asset from cloudinary");
    }
}


export { uploadOnCloudinary, getPublicId, deleteAssetFromCloudinary }