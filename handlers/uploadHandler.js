const fs = require("fs");
const path = require("path");
const sharp = require('sharp');
const User = require("../models/userModel");
const Post = require("../models/postModel");

const postCooldowns = {};

// Utility to check for post cooldowns
function isCooldownActive(userId) {
  const cooldownTime = 5000; 
  if (postCooldowns[userId] && Date.now() - postCooldowns[userId] < cooldownTime) {
    return true;
  }
  postCooldowns[userId] = Date.now(); 
  return false;
}

async function validatePostData(req, res, next) {
  const { filetitle, filedescription } = req.body;
  console.log(req.body)


  if (!filetitle || !filetitle.trim()) {
    req.session.error = "Title is required.";
    console.log("Title is required");
    return res.redirect("/pin-creation-tool"); // Redirect back to the form if validation fails
  }
  
  if (isCooldownActive(req.session.userId)) {
    req.session.error = "Please wait before creating another post.";
    return res.redirect("/profile"); 
  }

  next(); 
}



async function optimizeImage(filePath, qualityValue, resizeWidth = 800) {
  const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
  const sanitizedFilename = `optimized-${Date.now()}-${path.basename(filePath).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.-_]/g, '')}`;
  const outputFilePath = path.join(uploadDir, sanitizedFilename);

  await sharp(filePath)
      .resize(resizeWidth)
      .toFormat('jpeg')
      .jpeg({ quality: qualityValue })
      .toFile(outputFilePath);

  return sanitizedFilename;
}

async function createPost(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return handleError(res, "User not found");
    }

    const optimizedImageFileName = await optimizeImage(req.file.path, 80);

    const post = await Post.create({
      image: optimizedImageFileName,
      posttext: req.body.filetitle,
      user: user._id,
    });

    user.posts.push(post._id);
    await user.save();

    // Delete the original uploaded file
    const imagePath = path.join(__dirname, "../public/images/uploads", req.file.filename);
    try {
      await fs.promises.unlink(imagePath);
      console.log("Original image file deleted:", imagePath);
    } catch (err) {
      console.error("Error deleting original image file:", err.message);
    }

    req.session.success = "Post created successfully.";
    res.redirect("/profile");
  } catch (error) {
    console.error("Error creating post:", error.message);
    return handleError(res, "An error occurred while creating the post");
  }
}


async function deletePost(req, res) {
  try {
    const postId = req.params.id;

    if (!postId) {
      return handleError(res, "Can't find post id");
    }

    const post = await Post.findById(postId);
    if (!post) {
      return handleError(res, "Post not found");
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return handleError(res, "User not found");
    }

    if (post.user.toString() !== req.session.userId) {
      return handleError(res, "You are not authorized to delete this post");
    }

    await User.updateMany(
      { savedPosts: postId }, 
      { $pull: { savedPosts: postId } }
    );

    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return handleError(res, "Post not found");
    }

    await User.findByIdAndUpdate(req.session.userId, {
      $pull: { posts: postId }
    });

    await Post.findByIdAndDelete(postId);

    res.redirect("/profile");
  } catch (error) {
    return handleError(res, "An error occurred while deleting the post");
  }
}

module.exports = {
  validatePostData,
  createPost,
  deletePost,
};
