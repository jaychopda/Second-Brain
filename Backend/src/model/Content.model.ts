import mongoose, { Types } from "mongoose";

const contentSchema = new mongoose.Schema({
    link:{
        type: String,
        required: true
    },
    type:{
        type: String,
        enum: ["text", "image", "audio","youtube", "twitter", "notion", "url"],
        required: true
    },
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
    },
    tags:[{
        type: Types.ObjectId,
        ref: "Tag",
    }],
    createdAt:{
        type: String,
        default: new Date().toISOString()
    },
    userId:{
        type: Types.ObjectId,
        ref: "Users",
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    }
})

const ContentModel = mongoose.model("Content", contentSchema);

export {ContentModel}