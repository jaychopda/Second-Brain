import express from "express"
import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";
const app = express()
import z from 'zod'
import { connectDB } from "./db/db"
import {UserModel} from "./model/User.model"
import { authMiddleware } from "./middlewares/auth.user"
import { ContentModel } from "./model/Content.model"
import { TagModel } from "./model/Tag.model"
import { ShareModel } from "./model/Share.model"
import { random } from "./utils"
import cors from 'cors'

dotenv.config()

app.use(express.json())
app.use(cors())

async function main(){
    connectDB()
    app.listen(3000)
}

const User = z.object({
    username:z.string().min(3,"username have minimum length is 3").max(40),
    password:z.string().min(3,"password has minimum length of 3")
})

app.get('/',(req:any,res:any)=>{
    res.write("Hello")
    res.end()
})

app.post('/api/v1/signup',async (req:any,res:any)=>{
    const username = req.body.username
    const password = req.body.password

    const requiredBody = z.object({
        password : z.string(),
        username : z.string()
    })

    const parseDataWithSuccess = requiredBody.safeParse(req.body)

    if(!parseDataWithSuccess.success){
        res.status(411).json({
            message:"Invalid Input Form!!!"
        })
    }else{
        try {
            const check = await UserModel.findOne({username})
            if(check){
                return res.status(403).json({
                    Message:"User Already Exists"
                })
            }
            const hashedPassword = await bcrypt.hash(password,10)
            
            await UserModel.create({
                username,
                password:hashedPassword
            })
    
            res.status(200).json({
                message:"User Created Successfully"
            })
        }
        catch(e){
            res.status(500).json({
                message:"Server Error"
            })
        }
    }
})

app.post('/api/v1/signin',async(req:any, res:any)=>{
    const username = req.body.username
    const password = req.body.password

    const requiredBody = z.object({
        password : z.string(),
        username : z.string()
    })

    const parseDataWithSuccess = requiredBody.safeParse(req.body)

    if(!parseDataWithSuccess.success){
        res.status(411).json({
            message:"Invalid Input Form!!!"
        })
    }else{
        try {
            const user = await UserModel.findOne({username})
            if(user){
                const hashedPassword = await bcrypt.compare(password,user.password)
                const USER_JWT_SECRET = "drf36ftceyuh34u45y3iui34gbtbvenm23j4hb9nem"

                if(hashedPassword){
                    const token = jwt.sign({
                        id:user._id
                    },USER_JWT_SECRET)

                    res.status(200).json({
                        message:"Login Successfully",
                        token:token
                    })
                }else{
                    res.status(403).json({
                        message:"Password Is Incorrect"
                    })
                }
            }else{
                res.status(403).json({
                    message:"User Not Exists"
                })
            }
        }catch(e){
            res.status(500).json({
                message:"Server Error"
            })
        }
    }
})

app.post('/api/v1/content', authMiddleware, async(req:any, res:any)=>{
    const token = req.headers.token
    if(!token){
        return res.status(403).json({
            message:"Token is required"
        })
    }else{
        try{
            const user = req.user;
            const { link, type, title, tags } = req.body;
            const requiredBody = z.object({
                link: z.string(),
                type: z.string(),
                title: z.string().min(1, "Title is required"),
                tags: z.array(z.string()).optional()
            });

            const parseDataWithSuccess = requiredBody.safeParse(req.body)
            if(!parseDataWithSuccess.success){
                console.log(parseDataWithSuccess.error);
                return res.status(411).json({
                    message:"Invalid Input Form!!!"
                })
            }
            
            for(const tag of tags || []){
                const existingTag = await TagModel.findOne({ title: tag});
                if (!existingTag) {
                    const newTag = await TagModel.create({ title: tag});
                    req.body.tags = req.body.tags.map((t: string) => t=== tag? newTag._id : t);
                } else {
                    req.body.tags = req.body.tags.map((t: string) => t=== tag? existingTag._id : t);
                }
            }

            const content = await ContentModel.create({
                link,
                type,
                title,
                tags:req.body.tags,
                userId: user.id
            });

            res.status(201).json({
                message:"Content Created Successfully",
                content
            });
        }catch(e){
            console.error(e);
            res.status(500).json({
                message:"Server Error"
            })
        }
    }
})

app.get('/api/v1/content', authMiddleware, async(req:any, res:any)=>{
    const user = req.user;
    try {
        const contents = await ContentModel.find({ userId: user.id }).populate('tags','title').populate('userId', 'username');
        res.status(200).json({
            message: "Content Retrieved Successfully",
            contents
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
})

app.delete('/api/v1/content', authMiddleware, async(req:any, res:any)=>{
    const user = req.user;
    const { contentId } = req.body;

    if (!contentId) {
        return res.status(400).json({
            message: "Content ID is required"
        });
    }

    try {
        const content = await ContentModel.findOneAndDelete({ _id: contentId, userId: user.id });
        if (!content) {
            return res.status(404).json({
                message: "Content not found"
            });
        }

        res.status(200).json({
            message: "Content deleted successfully"
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
})

app.post('/api/v1/brain/share', authMiddleware, async(req:any, res:any)=>{
    const user = req.user;
    const share = req.body.share;

    if(share){
        try{
            const existingShare = await ShareModel.findOne({ userId: user.id});
            await ShareModel.deleteOne({ userId: user.id });

            const newShare = await ShareModel.create({ userId: user.id, hash: random(16) });
            res.status(200).json({
                message: "Content shared successfully",
                share: newShare
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({
                message: "Server Error"
            });
        }
    }else{
        try {
            const existingShare = await ShareModel.findOne({ userId: user.id });
            if (!existingShare) {
                return res.status(404).json({
                    message: "Share not found"
                });
            }else{
                await ShareModel.deleteOne({ userId: user.id });
            }

            res.status(200).json({
                message: "Share Functionality Disabled successfully",
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({
                message: "Server Error"
            });
        }
    }
})

app.get('/api/v1/brain/:hash', async(req:any, res:any)=>{
    const { hash } = req.params;
    if (!hash) {
        return res.status(400).json({
            message: "Hash is required"
        });
    }
    try {
        const share = await ShareModel.findOne({
            hash: hash
        }).populate('userId', 'username');

        if (!share) {
            return res.status(404).json({
                message: "Share not found"
            });
        }

        const contents = await ContentModel.find({ userId: share.userId })

        const username = await UserModel.findById(share.userId).select('username');

        res.status(200).json({
            message: "Share retrieved successfully",
            share: {
                user: username,
                contents: contents
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
})

main()