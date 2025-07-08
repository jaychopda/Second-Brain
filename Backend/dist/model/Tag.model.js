"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagModel = void 0;
const mongoose = require('mongoose');
const tagSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true }
});
const TagModel = mongoose.model('Tag', tagSchema);
exports.TagModel = TagModel;
