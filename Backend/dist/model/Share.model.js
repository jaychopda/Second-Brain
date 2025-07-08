"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const shareSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        unique: true
    },
    hash: {
        type: String,
        required: true,
        unique: true
    }
});
exports.ShareModel = mongoose_1.default.model("Share", shareSchema);
