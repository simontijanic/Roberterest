// Required modules
const User = require("../models/userModel");
const Post = require("../models/postModel");
const SavedPost = require("../models/savedPostModel");

const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs").promises;

// Utilities and controllers
const getProfilePicture = require("../utils/profilepictureUtils");
const { upload, optimizeImage, sanitizeFileName } = require("../utils/multerUtils");

// Constants
const PROFILE_COOLDOWN_MS = 60000; // Cooldown time for profile updates
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const BASE_UPLOAD_DIR = path.resolve(__dirname, "../images/uploads");

// Utility Functions
const deleteFile = async (filePath) => {
  try {
    const resolvedPath = path.resolve(BASE_UPLOAD_DIR, filePath);

    if (!resolvedPath.startsWith(BASE_UPLOAD_DIR)) {
      throw new Error("Path traversal detected!");
    }

    await fs.access(resolvedPath);
    await fs.unlink(resolvedPath);
    console.log("File deleted:", resolvedPath);
  } catch (err) {
    console.error("Error deleting file:", err.message);
  }
};

const isProfileCooldownActive = (profileCooldowns, userId) => {
  const lastUpdate = profileCooldowns[userId];
  if (lastUpdate && Date.now() - lastUpdate < PROFILE_COOLDOWN_MS) {
    return true;
  }
  profileCooldowns[userId] = Date.now();
  return false;
};

const handleError = (res, message, status = 500) => {
  console.error(message);
  res.status(status).render("error404", { message });
};

exports.getAuthenticatedUser = async (req) => {
  if (!req.isAuthenticated()) {
    throw new Error("User not authenticated");
  }
  return req.user;
};

// Middleware
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // Proceed to the next middleware or route handler
  }
  res.redirect('/login'); // Redirect if not authenticated
};


// Route Handlers
exports.getHome = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    let posts = await Post.find()
      .sort({ createdate: -1 })
      .populate("user", "username profilepicture");

    posts = posts.map((post) => ({
      ...post._doc,
      profilepicture: getProfilePicture(post.user),
    }));

    const profilePicture = getProfilePicture(user);

    res.render("home", { posts, profilepicture: profilePicture });
  } catch (error) {
    console.error("Error in getHome:", error);
    handleError(res, "Error fetching home content");
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    let posts = await Post.find({ user: user._id }).sort({ createdate: -1 });

    let savedPosts = await Post.find({ _id: { $in: user.savedPosts } })
      .populate("user", "username profilepicture")
      .exec();

    savedPosts = savedPosts
      .sort((a, b) => b.createdate - a.createdate)
      .map((post) => ({
        ...post._doc,
        imageUrl: post.image ? `/images/uploads/${post.image}` : null,
      }));

    const isEdit = req.query.edit === "true";
    const error = req.session.error || "";
    req.session.error = null;

    const profilePicture = getProfilePicture(user);

    res.render("profile", {
      username: user.username,
      profilepicture: profilePicture,
      isEdit,
      user,
      posts,
      error,
      savedPosts,
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    handleError(res, "Error fetching user profile");
  }
};

exports.getPost = async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId).populate("user");
    if (!post) {
      return res.status(404).send("Post not found");
    }

    const profilePicture = getProfilePicture(post.user);
    const currentUser = await getAuthenticatedUser(req);
    const hasSaved = currentUser.savedPosts.includes(postId);

    res.render("post-detail", {
      post,
      author: post.user.username,
      createdAt: post.createdate,
      postText: post.posttext,
      Description: post.description,
      profilepicture: profilePicture,
      hasSaved,
    });
  } catch (error) {
    console.error("Error in getPost:", error);
    res.status(500).send("Error fetching post details");
  }
};

exports.savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const user = await getAuthenticatedUser(req);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send("Post not found");
    }

    if (user.savedPosts.includes(postId)) {
      req.session.error = "This post is already saved.";
      return res.redirect("/profile");
    }

    user.savedPosts.push(postId);
    await user.save();

    res.redirect("/profile");
  } catch (error) {
    console.error("Error in savePost:", error);
    res.status(500).send("Error saving post");
  }
};

exports.getCreationPin = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    const profilePicture = getProfilePicture(user);

    res.render("pin-creation-tool", {
      profilepicture: profilePicture,
      error: req.session.error,
    });
  } catch (error) {
    handleError(res, "Error fetching user profile");
  }
};

exports.profileUpdate = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { username } = req.body;

    if (!username) {
      req.session.error = "Username is required.";
      return res.redirect("/profile");
    }

    if (req.file && isProfileCooldownActive(req.session.profileCooldowns, user._id)) {
      req.session.error = "Please wait before updating your profile picture again.";
      return res.redirect("/profile");
    }

    if (req.file) {
      if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        req.session.error = "Invalid image file type.";
        return res.redirect("/profile");
      }

      const optimizedFileName = await optimizeImage(req.file.path, 80, 400);
      if (user.profilepicture) {
        await deleteFile(path.join("profilepictures", user.profilepicture));
      }
      user.profilepicture = optimizedFileName;

      await fs.unlink(req.file.path);
    }

    user.username = username;
    await user.save();

    req.session.success = "Profile updated successfully.";
    res.redirect("/profile");
  } catch (error) {
    handleError(res, "Error updating profile");
  }
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return handleError(res, "Error logging out");
    }
    res.redirect("/login");
  });
};
