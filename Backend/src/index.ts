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
import axios from 'axios'
import { uploadOnCloudinary } from './utils/cloudinary'
import { upload } from "./middlewares/multer";
import { OAuth2Client } from 'google-auth-library'
// Note: You'll need to install multer first: npm install multer @types/multer
// import { upload } from './middlewares/multer'


dotenv.config()

// Increase payload limit for file uploads (base64 encoded files can be large)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors())

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/oauth/google/callback'
const JWT_SECRET = process.env.JWT_SECRET || 'drf36ftceyuh34u45y3iui34gbtbvenm23j4hb9nem'

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.')
    process.exit(1)
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)

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

// Debug endpoint to check OAuth configuration
app.get('/api/v1/debug/oauth', (req:any, res:any) => {
    res.json({
        clientId: GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
        clientSecret: GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
        redirectUri: GOOGLE_REDIRECT_URI,
        hasGoogleClient: !!googleClient,
        clientIdLength: GOOGLE_CLIENT_ID?.length || 0,
        clientSecretLength: GOOGLE_CLIENT_SECRET?.length || 0,
        nodeEnv: process.env.NODE_ENV
    })
})

app.post('/api/v1/signup',async (req:any,res:any)=>{
    const username = req.body.username
    const password = req.body.password
    const name = req.body.name || ''

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
                password:hashedPassword,
                name
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
                
                if(hashedPassword){ 
                    const token = jwt.sign({
                        id:user._id
                    },JWT_SECRET)

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

// Google OAuth: exchange code for tokens and sign in/up the user
app.post('/api/v1/auth/google', async (req:any, res:any) => {
    try {
        const { code } = req.body
        
        if (!code) {
            return res.status(400).json({ message: 'Authorization code is required' })
        }

        // Exchange authorization code for tokens
        const { tokens } = await googleClient.getToken({ code, redirect_uri: GOOGLE_REDIRECT_URI })

        if (!tokens.id_token) {
            return res.status(400).json({ message: 'Failed to obtain ID token from Google' })
        }

        // Verify the ID token
        const ticket = await googleClient.verifyIdToken({ idToken: tokens.id_token, audience: GOOGLE_CLIENT_ID })
        const payload = ticket.getPayload()

        if (!payload) {
            return res.status(400).json({ message: 'Invalid Google ID token' })
        }

        const googleId = payload.sub as string
        const email = (payload.email || '').toLowerCase()
        const name = payload.name || ''
        const picture = payload.picture || ''

        if (!email) {
            return res.status(400).json({ message: 'Google account has no email' })
        }

        // Find or create user
        let user = await UserModel.findOne({ username: email })

        if (!user) {
            // Create new user
            user = await UserModel.create({
                username: email,
                password: await bcrypt.hash(random(16), 10),
                name,
                googleId,
                avatar: picture
            })
        } else {
            // Update existing user's Google information if missing
            const shouldUpdate = (!user.googleId && googleId) || (!user.name && name) || (!user.avatar && picture)
            if (shouldUpdate) {
                user.googleId = user.googleId || googleId
                user.name = user.name || name
                user.avatar = user.avatar || picture
                await user.save()
            }
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, JWT_SECRET)

        res.status(200).json({
            message: 'Authenticated with Google',
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                avatar: user.avatar
            }
        })
    } catch (e:any) {
        console.error('Google auth error:', e)
        
        // Provide more specific error messages
        if (e.code === 'invalid_grant') {
            return res.status(400).json({ message: 'Authorization code has expired or is invalid' })
        }
        
        if (e.code === 'access_denied') {
            return res.status(400).json({ message: 'Access was denied by the user' })
        }
        
        if (e.code === 'invalid_client') {
            return res.status(400).json({ 
                message: 'Invalid OAuth client credentials. Please check your Google OAuth configuration.',
                details: 'This usually means the client ID or client secret is incorrect, or the OAuth app is not properly configured in Google Console.'
            })
        }
        
        res.status(500).json({ 
            message: 'Failed to authenticate with Google',
            error: e.message || 'Unknown error'
        })
    }
})

// Return current user's profile
app.get('/api/v1/me', authMiddleware, async (req:any, res:any) => {
    try {
        const userId = req.user?.id
        const user = await UserModel.findById(userId).select('username name avatar googleId')
        if (!user) return res.status(404).json({ message: 'User not found' })
        res.status(200).json({ user })
    } catch (e) {
        res.status(500).json({ message: 'Server Error' })
    }
})

// Change password
app.post('/api/v1/change-password', authMiddleware, async (req:any, res:any) => {
    try {
        const userId = req.user?.id
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'currentPassword and newPassword are required' })
        }

        const user = await UserModel.findById(userId)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const ok = await bcrypt.compare(currentPassword, user.password)
        if (!ok) return res.status(401).json({ message: 'Current password is incorrect' })

        const hashed = await bcrypt.hash(newPassword, 10)
        user.password = hashed
        await user.save()

        return res.status(200).json({ message: 'Password updated successfully' })
    } catch (e) {
        return res.status(500).json({ message: 'Server Error' })
    }
})

// Update user name
app.patch('/api/v1/user/name', authMiddleware, async (req:any, res:any) => {
    try {
        const userId = req.user?.id
        const { name } = req.body

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Valid name is required' })
        }

        const updated = await UserModel.findByIdAndUpdate(
            userId,
            { $set: { name } },
            { new: true, projection: 'username name avatar googleId' as any }
        )

        if (!updated) return res.status(404).json({ message: 'User not found' })

        return res.status(200).json({ message: 'Name updated successfully', user: updated })
    } catch (e) {
        return res.status(500).json({ message: 'Server Error' })
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
    const  contentId  = req.body.id;
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

// Simple base64 file upload route (alternative to multer)
app.post('/api/v1/upload-base64', authMiddleware, async (req: any, res: any) => {
    try {
        const { fileData, fileName, fileType } = req.body;
        
        if (!fileData || !fileName || !fileType) {
            return res.status(400).json({
                message: "Missing file data, name, or type"
            });
        }

        // Validate file type
        if (!fileType.startsWith('image/') && !fileType.startsWith('audio/')) {
            return res.status(400).json({
                message: "Only image and audio files are allowed"
            });
        }

        // Create temporary file from base64
        const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create uploads directory if it doesn't exist
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = "./uploads";
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(fileName);
        const tempFilePath = path.join(uploadsDir, `upload-${uniqueSuffix}${fileExtension}`);
        
        // Write file temporarily
        fs.writeFileSync(tempFilePath, buffer);

        // Upload to Cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(tempFilePath);
        
        if (!cloudinaryResponse) {
            return res.status(500).json({
                message: "Failed to upload file to cloud storage"
            });
        }

        res.status(200).json({
            message: "File uploaded successfully",
            url: cloudinaryResponse.url,
            publicId: cloudinaryResponse.public_id,
            resourceType: cloudinaryResponse.resource_type,
            format: cloudinaryResponse.format,
            originalName: fileName
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            message: "Server error during file upload"
        });
    }
});


app.post('/api/v1/upload', authMiddleware, upload.single('file'), async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        // Upload to Cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        
        if (!cloudinaryResponse) {
            return res.status(500).json({
                message: "Failed to upload file to cloud storage"
            });
        }

        res.status(200).json({
            message: "File uploaded successfully",
            url: cloudinaryResponse.url,
            publicId: cloudinaryResponse.public_id,
            resourceType: cloudinaryResponse.resource_type,
            format: cloudinaryResponse.format
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            message: "Server error during file upload"
        });
    }
});


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

app.get('/api/v1/brain', authMiddleware, async(req:any, res:any)=>{
    const user = req.user
})

app.get('/api/v1/secondBrainSearch/:query', async(req:any, res:any)=>{
    const { query } = req.params;
    if (!query) {
        return res.status(400).json({
            message: "Query is required"
        });
    }

    const token = req.headers.token
    const decoded = jwt.decode(token)
    if(!decoded){
        return res.status(403).json({
            message:"Token is required"
        })
    }

    let userId: string | undefined;
    if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
        userId = (decoded as { id: string }).id;
    } else {
        return res.status(403).json({
            message: "Invalid token payload"
        });
    }

    const response = await axios.post('http://127.0.0.1:8000/search/',{
        query:query,
        userId:userId,
        top:3
    })

    return res.status(200).json({
        data : response.data
    })
})

// Twitter oEmbed proxy endpoint with enhanced media extraction
app.get('/api/v1/twitter-embed/:tweetId', async (req: any, res: any) => {
    try {
        const { tweetId } = req.params;
        
        if (!tweetId) {
            return res.status(400).json({
                message: "Tweet ID is required"
            });
        }

        // Fetch tweet data from Twitter's oEmbed API with enhanced parameters
        const twitterUrl = `https://twitter.com/user/status/${tweetId}`;
        
        // Try different oEmbed configurations for better media extraction
        const oembedConfigs = [
            `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}&omit_script=false&dnt=false&theme=light&maxwidth=800&hide_thread=false&widget_type=video`,
            `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}&omit_script=true&dnt=true&theme=light&maxwidth=800&hide_media=false`,
            `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}&omit_script=true&dnt=true&theme=light&maxwidth=550`
        ];

        let response;
        let htmlContent = '';
        
        // Try different configurations to get the best media content
        for (const config of oembedConfigs) {
            try {
                response = await axios.get(config, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.data.html) {
                    htmlContent = response.data.html;
                    break;
                }
            } catch (configError) {
                if (configError && typeof configError === 'object' && 'message' in configError) {
                    console.log(`Config failed: ${config}`, (configError as any).message);
                } else {
                    console.log(`Config failed: ${config}`, configError);
                }
                continue;
            }
        }

        if (!response) {
            throw new Error('All oEmbed configurations failed');
        }

        
        // Enhanced image extraction with comprehensive patterns
        const images = [];
        
        // Pattern 1: Standard img tags with various Twitter media patterns
        const imagePatterns = [
            /<img[^>]+src=["']([^"']*pbs\.twimg\.com\/media\/[^"']+)["'][^>]*>/gi,
            /<img[^>]+src=["']([^"']*pic\.twitter\.com\/[^"']+)["'][^>]*>/gi,
            /<img[^>]+src=["']([^"']*twimg\.com\/media\/[^"']+)["'][^>]*>/gi,
            /<img[^>]+src=["']([^"']*pbs\.twimg\.com\/[^"']*(?:jpg|jpeg|png|gif|webp)[^"']*)["'][^>]*>/gi
        ];

        for (const pattern of imagePatterns) {
            let match;
            while ((match = pattern.exec(htmlContent)) !== null) {
                const src = match[1];
                if (!src.includes('profile_images') && !src.includes('profile_banners')) {
                    images.push(src);
                }
            }
        }
        
        // Pattern 2: Look for data attributes that might contain image URLs
        const dataPatterns = [
            /data-image=["']([^"']*pbs\.twimg\.com\/[^"']+)["']/gi,
            /data-src=["']([^"']*pbs\.twimg\.com\/[^"']+)["']/gi,
            /data-url=["']([^"']*pbs\.twimg\.com\/[^"']+)["']/gi,
            /src=["']([^"']*pbs\.twimg\.com\/media\/[^"']+)["']/gi
        ];

        for (const pattern of dataPatterns) {
            let match;
            while ((match = pattern.exec(htmlContent)) !== null) {
                images.push(match[1]);
            }
        }
        
        // Pattern 3: Look for URLs in any context that match Twitter media patterns
        const urlPattern = /(https?:\/\/pbs\.twimg\.com\/media\/[A-Za-z0-9_-]+\?format=[a-z]+)/gi;
        let urlMatch;
        while ((urlMatch = urlPattern.exec(htmlContent)) !== null) {
            images.push(urlMatch[1]);
        }

        // Enhanced video extraction
        const videos = [];
        
        // Video patterns
        const videoPatterns = [
            /<video[^>]+src=["']([^"']*video\.twimg\.com\/[^"']+)["'][^>]*>/gi,
            /<video[^>]+src=["']([^"']*pbs\.twimg\.com\/amplify_video\/[^"']+)["'][^>]*>/gi,
            /<video[^>]+poster=["']([^"']*pbs\.twimg\.com\/[^"']+)["'][^>]*>/gi,
            /data-video=["']([^"']*video\.twimg\.com\/[^"']+)["']/gi
        ];

        for (const pattern of videoPatterns) {
            let match;
            while ((match = pattern.exec(htmlContent)) !== null) {
                videos.push(match[1]);
            }
        }

        // Remove duplicates and enhance URLs
        const uniqueImages = [...new Set(images)].map(url => {
            // Clean and enhance image URLs
            let cleanUrl = url.replace(/&amp;/g, '&');
            
            // Convert to higher quality if possible
            if (cleanUrl.includes('format=')) {
                cleanUrl = cleanUrl.replace(/format=\w+/, 'format=jpg').replace(/name=\w+/, 'name=large');
            } else if (cleanUrl.includes('pbs.twimg.com')) {
                cleanUrl += cleanUrl.includes('?') ? '&name=large' : '?format=jpg&name=large';
            }
            
            return cleanUrl;
        });
        
        const uniqueVideos = [...new Set(videos)];

        // Enhanced media detection heuristics
        const mediaIndicators = {
            // Check for pic.twitter.com references
            hasPicTwitter: /pic\.twitter\.com\/\w+/i.test(htmlContent),
            
            // Check for media-related CSS classes
            hasMediaClasses: /class="[^"]*(?:media|photo|video|image)[^"]*"/i.test(htmlContent),
            
            // Check for Twitter media domains
            hasMediaDomains: /(?:pbs\.twimg\.com|video\.twimg\.com|pic\.twitter\.com)/i.test(htmlContent),
            
            // Check for media-related attributes
            hasMediaAttrs: /(?:data-image|data-video|data-media)/i.test(htmlContent),
            
            // Check for embedded player indicators
            hasPlayer: /(?:twitter-player|video-player|media-player)/i.test(htmlContent),
            
            // Check for attachment indicators
            hasAttachment: /attachment|media-attachment/i.test(htmlContent)
        };

        const mediaHints = Object.values(mediaIndicators).some(Boolean);
        const hasActualMedia = uniqueImages.length > 0 || uniqueVideos.length > 0;

        // If we detect media hints but no actual media URLs, try to construct them
        if (mediaHints && !hasActualMedia) {            
            // Look for pic.twitter.com links and try to construct media URLs
            const picTwitterMatches = htmlContent.match(/pic\.twitter\.com\/(\w+)/gi);
            if (picTwitterMatches) {
                for (const picMatch of picTwitterMatches) {
                    const mediaId = picMatch.split('/')[1];
                    // Note: This is a fallback - these URLs might not work due to Twitter's authentication
                    const constructedUrl = `https://pbs.twimg.com/media/${mediaId}?format=jpg&name=large`;
                    images.push(constructedUrl);
                }
            }
        }


        // Comprehensive response with all media information
        const tweetData = {
            ...response.data,
            tweet_id: tweetId,
            original_url: twitterUrl,
            fetched_at: new Date().toISOString(),
            media: {
                images: uniqueImages,
                videos: uniqueVideos,
                hasMedia: hasActualMedia || mediaHints,
                mediaCount: uniqueImages.length + uniqueVideos.length,
                mediaHints: mediaHints,
                indicators: mediaIndicators,
                extractionInfo: {
                    foundImages: uniqueImages.length,
                    foundVideos: uniqueVideos.length,
                    detectionMethod: hasActualMedia ? 'direct_extraction' : 'heuristic_detection',
                    configUsed: response.config?.url || 'unknown'
                }
            },
            enhanced_html: htmlContent,
            extraction_debug: {
                htmlLength: htmlContent.length,
                containsPicTwitter: mediaIndicators.hasPicTwitter,
                containsMediaDomains: mediaIndicators.hasMediaDomains
            }
        };

        res.status(200).json(tweetData);
    } catch (error: any) {
        console.error('Twitter embed error:', error.message);
        
        if (error.response?.status === 404) {
            return res.status(404).json({
                error: 'Tweet not found or may be private/deleted'
            });
        }
        
        if (error.response?.status === 403) {
            return res.status(403).json({
                error: 'Tweet is private or access is restricted'
            });
        }
        
        res.status(500).json({
            error: 'Failed to fetch tweet data',
            details: error.message
        });
    }
});

// Simple AI Chat endpoint (placeholder - replace with actual AI service)
app.post('/api/v1/ai-chat', authMiddleware, async (req: any, res: any) => {
    try {
        const { message, reference } = req.body;

        console.log("AI Chat Request:", message, reference);
        
        if (!message) {
            return res.status(400).json({
                message: "Message is required"
            });
        }

        // Simple mock AI responses (replace this with actual AI service like OpenAI)
        const responses = [
            "I understand your question. Based on your Second Brain content, I can help you find relevant information.",
            "That's an interesting point! Let me think about that...",
            "I can help you organize that information better. Have you considered categorizing it?",
            "Great question! Your Second Brain contains similar topics that might be useful.",
            "I'm here to help you make connections between your saved content and new ideas.",
            "That reminds me of some content you've saved before. Would you like me to search for related items?",
            "I can help you synthesize that information with your existing knowledge base.",
            "Interesting! I can see how that connects to your previous thoughts and saved content."
        ];

        // Simple keyword-based responses
        let aiReply = "";
        const lowerMessage = message.toLowerCase();

        // if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
        //     aiReply = "I can help you search through your Second Brain! What specific topic or keyword are you looking for?";
        // } else if (lowerMessage.includes('organize') || lowerMessage.includes('structure')) {
        //     aiReply = "Great idea! I can suggest ways to organize your content better. Consider using tags and categories to group related items.";
        // } else if (lowerMessage.includes('connect') || lowerMessage.includes('relate')) {
        //     aiReply = "Making connections is key to a powerful Second Brain! I can help you identify patterns and relationships between your saved content.";
        // } else if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
        //     aiReply = "I can help you summarize and distill key insights from your content. What would you like me to focus on?";
        // } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        //     aiReply = "Hello! I'm your AI assistant for your Second Brain. I can help you search, organize, and make connections between your saved content. What would you like to explore today?";
        // } else {
        //     // Random response for general queries
        //     aiReply = responses[Math.floor(Math.random() * responses.length)];
        // }

        const token = req.headers.token
        const decoded = jwt.decode(token)
        if(!decoded){
            return res.status(403).json({
                message:"Token is required"
            })
        }

        let userId: string | undefined;
        if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
            userId = (decoded as { id: string }).id;
        } else {
            return res.status(403).json({
                message: "Invalid token payload"
            });
        }

        const response = await axios.post('http://0.0.0.0:8000/ask',{
            query: message,
            userId: userId,
            ref: reference
        })

        res.status(200).json({
            reply: response.data.response || aiReply
        });

    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({
            message: "AI service temporarily unavailable. Please try again."
        });
    }
});

// Toggle public/private status for content
app.patch('/api/v1/content/public-toggle', authMiddleware, async (req:any, res:any) => {
    const user = req.user;
    const { id, isPublic } = req.body;
    if (!id || typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: 'Content ID and isPublic are required' });
    }
    try {
        const content = await ContentModel.findOneAndUpdate(
            { _id: id, userId: user.id },
            { isPublic },
            { new: true }
        );
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.status(200).json({ message: 'Content public/private status updated', content });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('api/v1/content/public-toggle',(req : any,res:any)=>{
   const { id, isPublic } = req.body;
   const token = req.headers.token;

   if (!token) {
       return res.status(403).json({
           message: "Token is required"
       });
   }

   const decoded = jwt.decode(token);
   if (!decoded) {
       return res.status(403).json({
           message: "Invalid token"
       });
   }

   const userId = (decoded as { id: string }).id;

   // Update the public/private status in the database
   // Define the updateContentVisibility function here
    async function updateContentVisibility(contentId: string, userId: string, isPublic: boolean) {
       const content = await ContentModel.findOne({ _id: contentId, userId: userId });
       if (!content) {
           throw new Error("Content not found or unauthorized");
       }
       content.isPublic = isPublic;
       await content.save();
    }

    updateContentVisibility(id, userId, isPublic)
       .then(() => {
           res.status(200).json({
               message: "Content visibility updated successfully"
           });
       })
       .catch((error) => {
           console.error('Error updating content visibility:', error);
           res.status(500).json({
               message: "Failed to update content visibility"
           });
       });
})

main()