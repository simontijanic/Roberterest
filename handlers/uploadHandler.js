const User = require("../models/userModel");
const Post = require("../models/postModel");
const fs = require("fs/promises");
const path = require("path");

async function createPost(req, res) {
    try {
      console.log("File uploaded:", req.file);
      console.log("Caption received:", req.body.filetitle);
  
      if (!req.file || !req.body.filetitle) {
        return res.status(400).send("File or caption is missing.");
      }
  
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).send("User not found.");
      }
  
      const post = await Post.create({
        image: req.file.filename,
        posttext: req.body.filetitle,
        user: user._id
      });
  
      user.posts.push(post._id);
      await user.save();
  
      const imagePath = path.join(__dirname, "../public/images/uploads", post.image);
      try {
          await fs.unlink(imagePath); 
          console.log("Image file deleted:", imagePath);
      } catch (err) {
          console.error("Error deleting image file:", err.message);
      }

      console.log("Post saved successfully:", post);
      res.redirect("/profile");
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).send("An error occurred while creating the post.");
    }
}

async function deletePost(req, res) {
  try {
    const postId = req.params.id;

    if (!postId) {
      return res.status(400).send("Cant find post id.");
    }

    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).send("Post not found");
    }


    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    if (post.user.toString() !== req.session.userId) {
      return res.status(403).send("You are not authorized to delete this post");
    }

    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).send("Post not found");
    }

    await User.findByIdAndUpdate(req.session.userId, {
      $pull: { posts: postId }
    });

    await Post.findByIdAndDelete(postId);

    console.log("Post deleted successfully:", post);
    res.redirect("/profile");
  } catch (error) {
    console.error("Error deleteing post:", error);
    res.status(500).send("An error occurred while deleting the post.");
  }
}

  
module.exports = {
  createPost,
  deletePost,
};
