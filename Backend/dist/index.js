"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const app = (0, express_1.default)();
const zod_1 = __importDefault(require("zod"));
const db_1 = require("./db/db");
const User_model_1 = require("./model/User.model");
const auth_user_1 = require("./middlewares/auth.user");
const Content_model_1 = require("./model/Content.model");
const Tag_model_1 = require("./model/Tag.model");
const Share_model_1 = require("./model/Share.model");
const utils_1 = require("./utils");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, db_1.connectDB)();
        app.listen(3000);
    });
}
const User = zod_1.default.object({
    username: zod_1.default.string().min(3, "username have minimum length is 3").max(40),
    password: zod_1.default.string().min(3, "password has minimum length of 3")
});
app.get('/', (req, res) => {
    res.write("Hello");
    res.end();
});
app.post('/api/v1/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const requiredBody = zod_1.default.object({
        password: zod_1.default.string(),
        username: zod_1.default.string()
    });
    const parseDataWithSuccess = requiredBody.safeParse(req.body);
    if (!parseDataWithSuccess.success) {
        res.status(411).json({
            message: "Invalid Input Form!!!"
        });
    }
    else {
        try {
            const check = yield User_model_1.UserModel.findOne({ username });
            if (check) {
                return res.status(403).json({
                    Message: "User Already Exists"
                });
            }
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            yield User_model_1.UserModel.create({
                username,
                password: hashedPassword
            });
            res.status(200).json({
                message: "User Created Successfully"
            });
        }
        catch (e) {
            res.status(500).json({
                message: "Server Error"
            });
        }
    }
}));
app.post('/api/v1/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const requiredBody = zod_1.default.object({
        password: zod_1.default.string(),
        username: zod_1.default.string()
    });
    const parseDataWithSuccess = requiredBody.safeParse(req.body);
    if (!parseDataWithSuccess.success) {
        res.status(411).json({
            message: "Invalid Input Form!!!"
        });
    }
    else {
        try {
            const user = yield User_model_1.UserModel.findOne({ username });
            if (user) {
                const hashedPassword = yield bcrypt_1.default.compare(password, user.password);
                const USER_JWT_SECRET = "drf36ftceyuh34u45y3iui34gbtbvenm23j4hb9nem";
                if (hashedPassword) {
                    const token = jsonwebtoken_1.default.sign({
                        id: user._id
                    }, USER_JWT_SECRET);
                    res.status(200).json({
                        message: "Login Successfully",
                        token: token
                    });
                }
                else {
                    res.status(403).json({
                        message: "Password Is Incorrect"
                    });
                }
            }
            else {
                res.status(403).json({
                    message: "User Not Exists"
                });
            }
        }
        catch (e) {
            res.status(500).json({
                message: "Server Error"
            });
        }
    }
}));
app.post('/api/v1/content', auth_user_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.token;
    if (!token) {
        return res.status(403).json({
            message: "Token is required"
        });
    }
    else {
        try {
            const user = req.user;
            const { link, type, title, tags } = req.body;
            const requiredBody = zod_1.default.object({
                link: zod_1.default.string(),
                type: zod_1.default.string(),
                title: zod_1.default.string().min(1, "Title is required"),
                tags: zod_1.default.array(zod_1.default.string()).optional()
            });
            const parseDataWithSuccess = requiredBody.safeParse(req.body);
            if (!parseDataWithSuccess.success) {
                console.log(parseDataWithSuccess.error);
                return res.status(411).json({
                    message: "Invalid Input Form!!!"
                });
            }
            for (const tag of tags || []) {
                const existingTag = yield Tag_model_1.TagModel.findOne({ title: tag });
                if (!existingTag) {
                    const newTag = yield Tag_model_1.TagModel.create({ title: tag });
                    req.body.tags = req.body.tags.map((t) => t === tag ? newTag._id : t);
                }
                else {
                    req.body.tags = req.body.tags.map((t) => t === tag ? existingTag._id : t);
                }
            }
            const content = yield Content_model_1.ContentModel.create({
                link,
                type,
                title,
                tags: req.body.tags,
                userId: user.id
            });
            res.status(201).json({
                message: "Content Created Successfully",
                content
            });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({
                message: "Server Error"
            });
        }
    }
}));
app.get('/api/v1/content', auth_user_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        const contents = yield Content_model_1.ContentModel.find({ userId: user.id }).populate('tags', 'title').populate('userId', 'username');
        res.status(200).json({
            message: "Content Retrieved Successfully",
            contents
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
}));
app.delete('/api/v1/content', auth_user_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { contentId } = req.body;
    if (!contentId) {
        return res.status(400).json({
            message: "Content ID is required"
        });
    }
    try {
        const content = yield Content_model_1.ContentModel.findOneAndDelete({ _id: contentId, userId: user.id });
        if (!content) {
            return res.status(404).json({
                message: "Content not found"
            });
        }
        res.status(200).json({
            message: "Content deleted successfully"
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
}));
app.post('/api/v1/brain/share', auth_user_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const share = req.body.share;
    if (share) {
        try {
            const existingShare = yield Share_model_1.ShareModel.findOne({ userId: user.id });
            yield Share_model_1.ShareModel.deleteOne({ userId: user.id });
            const newShare = yield Share_model_1.ShareModel.create({ userId: user.id, hash: (0, utils_1.random)(16) });
            res.status(200).json({
                message: "Content shared successfully",
                share: newShare
            });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({
                message: "Server Error"
            });
        }
    }
    else {
        try {
            const existingShare = yield Share_model_1.ShareModel.findOne({ userId: user.id });
            if (!existingShare) {
                return res.status(404).json({
                    message: "Share not found"
                });
            }
            else {
                yield Share_model_1.ShareModel.deleteOne({ userId: user.id });
            }
            res.status(200).json({
                message: "Share Functionality Disabled successfully",
            });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({
                message: "Server Error"
            });
        }
    }
}));
app.get('/api/v1/brain/:hash', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { hash } = req.params;
    if (!hash) {
        return res.status(400).json({
            message: "Hash is required"
        });
    }
    try {
        const share = yield Share_model_1.ShareModel.findOne({
            hash: hash
        }).populate('userId', 'username');
        if (!share) {
            return res.status(404).json({
                message: "Share not found"
            });
        }
        const contents = yield Content_model_1.ContentModel.find({ userId: share.userId });
        const username = yield User_model_1.UserModel.findById(share.userId).select('username');
        res.status(200).json({
            message: "Share retrieved successfully",
            share: {
                user: username,
                contents: contents
            }
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
}));
main();
