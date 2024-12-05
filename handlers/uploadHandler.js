const path = require("path");
const sharp = require('sharp');
const User = require("../models/userModel");
const Post = require("../models/postModel");

const fs = require("fs").promises; 

const getProfilePicture = require("../controllers/profilepictureController")

async function deleteFile(filePath) {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log("File deleted:", filePath);
  } catch (err) {
    console.error("Error deleting file:", err.message);
  }
}

async function getAuthenticatedUser(req) {
  if (!req.isAuthenticated()) {
    throw new Error("User not authenticated");
  }
  return req.user;
}

const postCooldowns = {};

function handleError(res, message, status = 500) {
  res.status(status);
  
  res.render("error404", { message });
}

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

  if (!filetitle || filetitle.trim().length === 0) {
    req.session.error = "Title is required.";
    return res.redirect("/pin-creation-tool");
  }

  if (filetitle.length > 28) {
    req.session.error = "Title cannot exceed 28 characters.";
    return res.redirect("/pin-creation-tool");
  }

  if (filedescription && filedescription.length > 150) {
    req.session.error = "Description cannot exceed 150 characters.";
    return res.redirect("/pin-creation-tool");
  }

  if (!req.file) {
    req.session.error = "No file uploaded.";
    return res.redirect("/pin-creation-tool");
  }

  if (isCooldownActive(req.session.userId)) {
    req.session.error = "Please wait before creating another post.";
    return res.redirect("/pin-creation-tool");
  }

  next();
}

async function optimizeImage(filePath, qualityValue, resizeWidth = 800) {
  const uploadDir = path.join(__dirname, '..', 'images', 'uploads');
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
    const user = await getAuthenticatedUser(req);
    console.log("Authenticated user:", user);

    const profilePicture = getProfilePicture(user); 

    if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
      req.session.error = "Invalid image file type.";
      return res.render("pin-creation-tool", {
        error: req.session.error || null, 
        success: req.session.success || null,    
        profilepicture: profilePicture
      });
    }

    const optimizedImageFileName = await optimizeImage(req.file.path, 80);

    const post = await Post.create({
      image: optimizedImageFileName,
      posttext: req.body.filetitle,
      description: req.body.filedescription,
      user: user._id,
    });

    user.posts.push(post._id);
    await user.save();

    const imagePath = path.join(__dirname, "../images/uploads", req.file.filename);
    await deleteFile(imagePath);

    req.session.success = "Post created successfully.";
    
    return res.render("pin-creation-tool", {
      error: null,    
      success: req.session.success,    
      profilepicture: profilePicture,
    });
  } catch (error) {
    const user = await User.findById(req.session.userId);
    const profilePicture = getProfilePicture(user);
    return res.render("pin-creation-tool", {
      profilepicture: profilePicture,
    });
  } finally {
    if (req.file) {
      const imagePath = path.join(__dirname, "../images/uploads", req.file.filename);
      deleteFile(imagePath);
    }
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
