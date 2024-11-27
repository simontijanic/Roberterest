const User = require("../models/userModel");
const Post = require("../models/postModel");

async function createPost(req, res) {
    try {
      console.log("File uploaded:", req.file);
      console.log("Caption received:", req.body.filecaption);
  
      if (!req.file || !req.body.filecaption) {
        return res.status(400).send("File or caption is missing.");
      }
  
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).send("User not found.");
      }
  
      const post = await Post.create({
        image: req.file.filename,
        posttext: req.body.filecaption,
        user: user._id
      });
  
      user.posts.push(post._id);
      await user.save();
  
      console.log("Post saved successfully:", post);
      res.redirect("/profile");
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).send("An error occurred while creating the post.");
    }
}
  
module.exports = {
  createPost,
};
