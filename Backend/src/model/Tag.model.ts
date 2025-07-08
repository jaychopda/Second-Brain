const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }
});

const TagModel = mongoose.model('Tag', tagSchema);
export { TagModel };
