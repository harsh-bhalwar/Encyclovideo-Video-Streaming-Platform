import { v2 as cloudinary, v2 } from "cloudinary";
import { log } from "console";
// import { log } from "console";
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
        console.log(
            "Image has been uploaded on Cloudinary Successfully\n Public URL: " +
                response.url
        );

        // If the image is succesfully uploaded remove it from local path
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // Remove the locally saved file.
    }
};

const getPublicId = function (url) {
    return url.split("/").slice(-1)[0].split(".")[0];
};

const deleteImageFromCloudinary = async function (url) {
    try {
        const publicID = getPublicId(url);

        console.log(publicID);
        
        const result = await cloudinary.uploader.destroy(publicID, 
            {   
                resource_type: "image",
                invalidate: true
            }
        );
        console.log("Result : ", result);
    } catch (error) {
        console.log(error.message || "Error in deleting asset from cloudinary");
    }
};

const deleteVideoFromCloudinary = async function (url) {
    try {
        const publicID = getPublicId(url);

        console.log(publicID);
        
        const result = await cloudinary.uploader.destroy(publicID, 
            {
                resource_type: "video",
                invalidate: true
            }
        );
        console.log("Result : ", result);
    } catch (error) {
        console.log(error.message || "Error in deleting asset from cloudinary");
    }
};

const uploadVideoOnCloudinary = async function (localFilePath) {
    try {
        if (!localFilePath) throw new Error(" Cannot found Local File Path.");
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "video",
            eager: [
                { width: 640, height: 360, crop: "scale", format: "mp4" },
                { width: 854, height: 480, crop: "scale", format: "mp4" },
                { width: 1280, height: 720, crop: "scale", format: "mp4" },
                { width: 1920, height: 1080, crop: "scale", format: "mp4" }
            ],
            eager_async: true
        });

        // console.log("Video Has Been Uploaded Successfully: "+response);
        // If the video has been successfully uploaded, delete it from public/temp
        fs.unlinkSync(localFilePath)

        return response;
    } catch (error) {
        console.log(error.message || "Error in uploading video on Cloudinary");
    }
};

export { uploadOnCloudinary, getPublicId, deleteImageFromCloudinary, deleteVideoFromCloudinary, uploadVideoOnCloudinary};
