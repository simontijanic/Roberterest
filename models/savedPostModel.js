const mongoose = require("mongoose");

const savedPostSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  savedAt: { type: Date, default: Date.now },
});

const SavedPost = mongoose.model("SavedPost", savedPostSchema);

module.exports = SavedPost;
