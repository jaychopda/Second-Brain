"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
function authMiddleware(req, res, next) {
    const token = req.headers.token;
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });
    }
    const secretKey = "drf36ftceyuh34u45y3iui34gbtbvenm23j4hb9nem";
    const decodedToken = jsonwebtoken_1.default.verify(token, secretKey);
    if (!decodedToken) {
        return res.status(403).json({
            message: "Forbidden access, invalid token"
        });
    }
    req.user = jsonwebtoken_1.default.decode(token);
    next();
}
