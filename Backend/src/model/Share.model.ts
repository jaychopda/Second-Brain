import mongoose from "mongoose";
import { UserModel } from "./User.model";

const shareSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        unique: true
    },
    hash:{
        type: String,
        required: true,
        unique: true
    }
})

export const ShareModel = mongoose.model("Share", shareSchema);