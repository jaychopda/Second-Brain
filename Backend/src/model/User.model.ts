import mongoose from 'mongoose'
const User = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:false,
        default: ''
    },
    googleId:{
        type:String,
        required:false,
        unique:false,
        default: ''
    },
    avatar:{
        type:String,
        required:false,
        default: ''
    }
})

const UserModel = mongoose.model("Users",User)

export {UserModel}