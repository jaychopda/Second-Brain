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
// Note: You'll need to install multer first: npm install multer @types/multer
// import { upload } from './middlewares/multer'


dotenv.config()

// Increase payload limit for file uploads (base64 encoded files can be large)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
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

    const response = await axios.post('http://127.0.0.1:8000/search',{
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
                    console.log(`Successfully fetched with config: ${config}`);
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

        console.log('HTML Content received:', htmlContent.substring(0, 800)); // More detailed debug log
        
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
            console.log('Media detected but no URLs found, attempting URL construction...');
            
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

        console.log('Media extraction results:', {
            images: uniqueImages,
            videos: uniqueVideos,
            mediaIndicators,
            totalFound: uniqueImages.length + uniqueVideos.length
        });

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

// Debug endpoint to test media extraction for specific tweets
app.get('/api/v1/debug-tweet/:tweetId', async (req: any, res: any) => {
    try {
        const { tweetId } = req.params;
        const twitterUrl = `https://twitter.com/user/status/${tweetId}`;
        
        // Test all configurations and return results
        const results = [];
        
        const configs = [
            { name: 'Standard', url: `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}&omit_script=true&dnt=true&theme=light&maxwidth=550` },
            { name: 'Large', url: `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}&omit_script=true&dnt=true&theme=light&maxwidth=800` },
            { name: 'Video', url: `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}&omit_script=false&dnt=false&theme=light&maxwidth=800&widget_type=video` },
            { name: 'No Hide Media', url: `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}&omit_script=true&dnt=true&theme=light&maxwidth=800&hide_media=false` }
        ];
        
        for (const config of configs) {
            try {
                const response = await axios.get(config.url, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json'
                    }
                });
                
                const html = response.data.html || '';
                const mediaUrls = [];
                
                // Extract all potential media URLs
                const patterns = [
                    /pbs\.twimg\.com\/media\/[^"'\s]+/gi,
                    /pic\.twitter\.com\/\w+/gi,
                    /video\.twimg\.com\/[^"'\s]+/gi
                ];
                
                for (const pattern of patterns) {
                    const matches = html.match(pattern) || [];
                    mediaUrls.push(...matches);
                }
                
                results.push({
                    config: config.name,
                    success: true,
                    htmlLength: html.length,
                    mediaUrls: [...new Set(mediaUrls)],
                    hasPicTwitter: /pic\.twitter\.com/i.test(html),
                    hasMediaDomains: /pbs\.twimg\.com/i.test(html)
                });
            } catch (error: any) {
                results.push({
                    config: config.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        res.status(200).json({
            tweetId,
            twitterUrl,
            results,
            summary: {
                totalConfigs: configs.length,
                successfulConfigs: results.filter(r => r.success).length,
                totalMediaUrls: results.reduce((acc, r) => acc + (r.mediaUrls?.length || 0), 0)
            }
        });
    } catch (error: any) {
        res.status(500).json({
            error: 'Debug failed',
            details: error.message
        });
    }
});

main()