import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

export function authMiddleware(req:any, res:any, next:any) {
    const token = req.headers.token;
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });
    }

    const secretKey = process.env.JWT_SECRET || "drf36ftceyuh34u45y3iui34gbtbvenm23j4hb9nem"

    try {
        const decodedToken = jwt.verify(token, secretKey);
        if (!decodedToken) {
            return res.status(403).json({
                message: "Forbidden access, invalid token"
            });
        }
        req.user = jwt.decode(token);
        next();
    } catch (error) {
        return res.status(403).json({
            message: "Forbidden access, invalid token"
        });
    }
}