const User = require("../models/userModel");
const Post = require("../models/postModel");
const savedPost = require("../models/savedPostModel");

const bcrypt = require("bcrypt");
const path = require("path");

const fs = require("fs").promises;

const {getProfilePicture} = require("../utils/profilepictureUtils");

const {
  upload,
  optimizeImage,
  sanitizeFileName,
} = require("../utils/multerController");   

const {
  validatePassword,
  validateEmail,
} = require("../utils/validationController");

async function deleteFile(filePath) {
  try {
    const baseDir = path.resolve(__dirname, '../images/uploads'); // Define allowed base directory
    const resolvedPath = path.resolve(baseDir, filePath); // Resolve the filePath relative to baseDir

    // Ensure the resolved path is within the allowed directory
    if (!resolvedPath.startsWith(baseDir)) {
      throw new Error("Path traversal detected!");
    }

    // Check if the file exists before attempting to delete
    await fs.access(resolvedPath);
    await fs.unlink(resolvedPath);
    console.log("File deleted:", resolvedPath);
  } catch (err) {
    console.error("Error deleting file:", err.message);
  }
}


const profileCooldowns = {};

function isProfileCooldownActive(userId) {
  const cooldownTime = 60000;
  if (
    profileCooldowns[userId] &&
    Date.now() - profileCooldowns[userId] < cooldownTime
  ) {
    return true;
  }
  profileCooldowns[userId] = Date.now();
  return false;
}

async function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

function handleError(res, message, status = 500) {
  res.render("error404", { message });
}

async function getAuthenticatedUser(req) {
  if (!req.isAuthenticated()) {
    throw new Error("User not authenticated");
  }
  return req.user;
}

async function getHome(req, res) {
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
}

async function getProfile(req, res) {
  try {
    const user = await getAuthenticatedUser(req);

    let posts = await Post.find({ user: user._id }).sort({ createdate: -1 });

    let savedPosts = await Post.find({ _id: { $in: user.savedPosts } })
      .populate("user", "username profilepicture")
      .exec();

    savedPosts = savedPosts.sort((a, b) => b.createdate - a.createdate);

    savedPosts = savedPosts.map((post) => {
      return {
        ...post._doc,
        imageUrl: post.image ? `/images/uploads/${post.image}` : null,
      };
    });

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
    console.log(error);
    handleError(res, "Error fetching user profile");
  }
}

async function getPost(req, res) {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId).populate("user");

    if (!post) {
      return res.status(404).send("Post not found");
    }

    const user = post.user;

    const profilePicture = getProfilePicture(user);

    const currentUser = await getAuthenticatedUser(req);
    const hasSaved = currentUser.savedPosts.includes(postId);

    res.render("post-detail", {
      post: post, // The post object to use in the template
      author: post.user.username, // The user (creator) of the post
      createdAt: post.createdate, // The post creation date
      postText: post.posttext, // The description text of the post
      Description: post.description, // The description text of the post
      profilepicture: profilePicture,
      hasSaved,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).send("Error fetching post details");
  }
}

async function savePost(req, res) {
  try {
    const { postId } = req.params;
    const user = await getAuthenticatedUser(req);

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Check if the post is already saved
    const postIndex = user.savedPosts.indexOf(postId);
    if (postIndex !== -1) {
      // Unsave the post
      user.savedPosts.splice(postIndex, 1);
      req.session.message = "Post unsaved successfully.";
    } else {
      // Save the post
      user.savedPosts.push(postId);
      req.session.message = "Post saved successfully.";
    }

    await user.save();

    return res.redirect("/profile");
  } catch (error) {
    console.error("Error saving/unsaving post:", error);
    res.status(500).send("Error saving/unsaving post");
  }
}

async function getCreationPin(req, res) {
  try {
    const user = await getAuthenticatedUser(req);

    const posts = await Post.find({ user: user._id }).sort({ createdate: -1 });
    const isEdit = req.query.edit === "true";

    const profilePicture = getProfilePicture(user);

    res.render("pin-creation-tool", {
      profilepicture: profilePicture,
      error: req.session.error,
    });
  } catch (error) {
    handleError(res, "Error fetching user profile");
  }
}

async function profileUpdate(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const { username } = req.body;

    if (!username) {
      req.session.error = "Username is required.";
      return res.redirect("/profile");
    }

    if (req.file && isProfileCooldownActive(req.session.userId)) {
      console.log("Please wait before updating your profile picture again");
      req.session.error =
        "Please wait before updating your profile picture again.";
      return res.redirect("/profile");
    }

    if (req.file) {
      if (!["image/jpeg", "image/png"].includes(req.file.mimetype)) {
        req.session.error = "Invalid image file type.";
        return res.redirect("/profile");
      }
      if (user.profilepicture) {
        const oldProfilePicturePath = path.join(
          __dirname,
          "..",
          "images",
          "profilepictures",
          user.profilepicture
        );

        if (fs.existsSync(oldProfilePicturePath)) {
          try {
            await fs.promises.unlink(oldProfilePicturePath);
            console.log("Old profile picture deleted successfully.");
          } catch (err) {
            console.error("Error deleting old profile picture:", err);
          }
        }
      }

      const optimizedFileName = await optimizeImage(req.file.path, 80, 400);
      user.profilepicture = optimizedFileName;

      try {
        await fs.promises.unlink(req.file.path);
        console.log("Original uploaded file deleted successfully.");
      } catch (err) {
        console.error("Error deleting original uploaded file:", err);
      }
    }

    user.username = username;

    await user.save();

    req.session.success = "Profile updated successfully.";
    res.redirect("/profile");
  } catch (error) {
    handleError(res, "Error updating profile");
  } finally {
    if (req.file && req.file.filename) {
      const imagePath = path.join(
        __dirname,
        "../images/uploads",
        req.file.filename
      );
      deleteFile(imagePath);
    }
  }
}

function logout(req, res) {
  req.logout((err) => {
    if (err) {
      return handleError(res, "Error logging out");
    }
    res.redirect("/login");
  });
}

async function searchPost(req, res){
  try {
    const query = req.query.query || ''; // Get the query string
    const searchResults = await Post.find({
        $or: [
            { posttext: { $regex: query, $options: 'i' } }, // Match in posttext
            { tags: { $regex: query, $options: 'i' } } // Match in tags (if posts have tags)
        ],
    }).limit(20); // Limit results to prevent overloading

    res.json(searchResults); // Return results as JSON
} catch (error) {
    console.error(error);
    res.status(500).send('Error occurred during search.');
}
}

module.exports = {
  ensureAuthenticated,
  getHome,
  getProfile,
  profileUpdate,
  logout,
  getCreationPin,
  getPost,
  savePost,
  searchPost,
};
