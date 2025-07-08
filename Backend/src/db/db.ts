import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()


async function connectDB(){
    // const dbUrl = process.env.DB_URL
    const dbUrl = "mongodb+srv://jaychopda:Jay1234@unstoppable.somfy.mongodb.net"
    if (!dbUrl) {
        throw new Error("DB_URL environment variable is not defined");
    }
    await mongoose.connect(`${dbUrl}/SecondBrain`);
    console.log("Connected to MongoDB");
}

export {connectDB}