const path = require("path");
const Joi = require("joi");
const fs = require("fs").promises;
const User = require("../models/userModel");
const Post = require("../models/postModel");
const getProfilePicture = require("../utils/profilepictureUtils");
const { optimizeImage, deleteFile } = require("../utils/fileUtils");

const allowedFields = ["filetitle", "filedescription"];
const postCooldowns = {};

const authController = require("../controllers/authController");

const joiPostSchema = Joi.object({
  filetitle: Joi.string().trim().max(28).required(),
  filedescription: Joi.string().trim().max(150).optional(),
});

// Check if the post creation cooldown is active for the user
function isCooldownActive(userId) {
  const cooldownTime = 5000; // 5 seconds cooldown
  if (
    postCooldowns[userId] &&
    Date.now() - postCooldowns[userId] < cooldownTime
  ) {
    return true;
  }
  postCooldowns[userId] = Date.now();
  return false;
}

// Post data validation middleware
exports.validatePostData = async (req, res, next) => {
  try {
    req.body = _.pick(req.body, allowedFields);

    const { error } = joiPostSchema.validate(req.body, { abortEarly: false });

    if (error) {
      req.session.error = error.details
        .map((detail) => detail.message)
        .join(", ");
      return res.redirect("/pin-creation-tool");
    }

    next();
  } catch (err) {
    req.session.error = "Validation failed.";
    res.redirect("/pin-creation-tool");
  }
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const user = await authController.getAuthenticatedUser(req);
    console.log("Authenticated user:", user);

    const profilePicture = getProfilePicture(user);

    if (!["image/jpeg", "image/png"].includes(req.file.mimetype)) {
      req.session.error = "Invalid image file type.";
      return res.render("pin-creation-tool", {
        error: req.session.error || null,
        success: req.session.success || null,
        profilepicture: profilePicture,
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

    const imagePath = path.join(
      __dirname,
      "../images/uploads",
      req.file.filename
    );
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
      const imagePath = path.join(
        __dirname,
        "../images/uploads",
        req.file.filename
      );
      deleteFile(imagePath);
    }
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
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
      $pull: { posts: postId },
    });

    res.redirect("/profile");
  } catch (error) {
    return handleError(res, "An error occurred while deleting the post");
  }
};
