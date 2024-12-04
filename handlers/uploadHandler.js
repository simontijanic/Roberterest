const path = require("path");
const sharp = require('sharp');
const User = require("../models/userModel");
const Post = require("../models/postModel");

const fs = require("fs").promises;  // Use promises from fs module to avoid callbacks

async function deleteFile(filePath) {
  try {
    await fs.access(filePath);  // Check if the file exists
    await fs.unlink(filePath);  // Proceed to delete if it exists
    console.log("File deleted:", filePath);
  } catch (err) {
    console.error("Error deleting file:", err.message);
  }
}


const postCooldowns = {};

function handleError(res, message, status = 500) {
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

  if (req.file) {
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
  } else {
    console.log('No file uploaded!');
    return res.redirect("/pin-creation-tool");
  }
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
    const user = await User.findById(req.session.userId);
    if (!user) {
      return handleError(res, "User not found");
    }

    if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
      req.session.error = "Invalid image file type.";
      return res.redirect("/profile");
    }    
    const optimizedImageFileName = await optimizeImage(req.file.path, 80);

    const post = await Post.create({
      image: optimizedImageFileName,
      posttext: req.body.filetitle,
      user: user._id,
    });

    
    user.posts.push(post._id);
    await user.save();

    const imagePath = path.join(__dirname, "../images/uploads", req.file.filename);
    await deleteFile(imagePath);


    req.session.success = "Post created successfully.";
    res.redirect("/profile");
  } catch (error) {
    console.error("Error creating post:", error.message);
    return handleError(res, "An error occurred while creating the post");
  } finally {
    if (req.file) {
      const imagePath = path.join(__dirname, "../images/uploads", req.file.filename);
      deleteFile(imagePath); // Ensuring deletion only if it exists
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
