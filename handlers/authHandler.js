const User = require("../models/userModel");
const Post = require("../models/postModel");
const savedPost = require("../models/savedPostModel");

const bcrypt = require("bcrypt");
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const upload = require("../controllers/multerController");

const profileCooldowns = {};  // Store cooldowns for users

function isProfileCooldownActive(userId) {
  const cooldownTime = 60000; 
  if (profileCooldowns[userId] && Date.now() - profileCooldowns[userId] < cooldownTime) {
    return true;
  }
  profileCooldowns[userId] = Date.now();
  return false;
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


function sanitizeFileName(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const sanitizedFilename = `optimized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${path.basename(filePath).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.-_]/g, '')}`;
    return sanitizedFileName;
}


function generateDefaultProfilePicture(username) {
    const initials = username.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
    const backgroundColor = '#3498db';
    const textColor = '#ffffff'; 

    return `https://ui-avatars.com/api/?name=${initials}&background=${backgroundColor.replace('#', '')}&color=${textColor.replace('#', '')}`;
}

async function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect("/login");
    }
}

function handleError(res, message, status = 500) {
    res.render("error404", { message });
  }  

const validatePassword = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
};

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
};

// -- FUNCTIONS -- \\

async function getAuthenticatedUser(req) {
    if (!req.session || !req.session.userId) {
        throw new Error("User not authenticated");
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
        throw new Error("User not found");
    }
    return user;
}


// Controllers
async function login(req, res) {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            req.session.error = "Invalid credentials.";
            res.redirect("/login");      
        }

        req.session.userId = user._id;
        res.redirect("/home");
    } catch (error) {
        handleError(res, "An error occurred during login");
    }
}

async function signup(req, res) {
    const { email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        req.session.error = "Passwords do not match.";
        return res.redirect("/signup");  
    }
    if (!validatePassword(password)) {
        req.session.error = "Password must meet complexity requirements.";
        return  res.redirect("/signup");  
    }

    if (!validateEmail(email)) {
        req.session.error = "Invalid email format.";
        return res.redirect("/signup");  
    }

    try {
        if (await User.findOne({ email })) {
            return res.render("signup", { error: "Email is already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.redirect("/login");
    } catch (error) {
        handleError(res, "An error occurred during sign-up");
    }
}

async function getHome(req, res) {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user.username) {
            user.username = user.email.split("@")[0];
            await user.save();
        }

        let posts = await Post.find()
            .sort({ createdate: -1 })
            .populate('user', 'username profilepicture'); // Assuming "userId" links to the User model

        const profilePicture = user.profilepicture 
            ? `/images/uploads/${user.profilepicture}`
            : generateDefaultProfilePicture(user.username);

        res.render("home", { posts, profilepicture: profilePicture });
    } catch (error) {
        handleError(res, "Error fetching home content");
    }
}


async function getProfile(req, res) {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user.username) {
            user.username = user.email.split("@")[0];
            await user.save();
        }

        let posts = await Post.find({ user: user._id }).sort({ createdate: -1 });

        let savedPosts = await Post.find({ '_id': { $in: user.savedPosts } })
            .populate('user', 'username profilepicture') // Populate user information if needed
            .exec();

        // Sort the posts by createdate
        savedPosts = savedPosts.sort((a, b) => b.createdate - a.createdate);

        savedPosts = savedPosts.map(post => {
            return {
                ...post._doc, // Ensure we are using the raw document data
                imageUrl: post.image ? `/images/uploads/${post.image}` : null // Map the image URL if image exists
            };
        });

        const isEdit = req.query.edit === 'true';

        const error = req.session.error || ""; // Default to an empty string
        req.session.error = null; // Clear the error after passing it
      
        const profilePicture = user.profilepicture 
            ? `/images/uploads/${user.profilepicture}`
            : generateDefaultProfilePicture(user.username);

        
            
        res.render("profile", {
            email: user.email,
            username: user.username,
            profilepicture: profilePicture,
            isEdit,
            user,
            posts,
            error,
            savedPosts,
        });
    } catch (error) {
        console.log(error)
        handleError(res, "Error fetching user profile");
    }
}

async function getPost(req, res) {
    try {
        const postId = req.params.postId; 

        const post = await Post.findById(postId).populate('user');  

        if (!post) {
            return res.status(404).send("Post not found");
        }

        const user = post.user; 

        const profilePicture = user.profilepicture 
            ? `/images/uploads/${user.profilepicture}`
            : generateDefaultProfilePicture(user.username);

        res.render('post-detail', {
            post: post,         // The post object to use in the template
            author: post.user.username,  // The user (creator) of the post
            createdAt: post.createdate,  // The post creation date
            description: post.posttext,  // The description text of the post
            profilepicture: profilePicture,
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).send("Error fetching post details");
    }
}

async function savePost(req, res) {
    try {
        const { postId } = req.params;  // Extract postId from the route parameters
        const userId = req.session.userId;  // Get the userId from session (assuming user is authenticated)

        if (!userId) {
            return res.status(401).send('Unauthorized');
        }

        const post = await Post.findById(postId);  // Find the post by its ID

        if (!post) {
            return res.status(404).send('Post not found');
        }

        const user = await User.findById(userId);  // Find the user


        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.savedPosts.includes(postId)) {
            req.session.error = "This post is already saved.";
            return res.redirect("/profile");
        }

        user.savedPosts.push(postId);  

        await user.save();  

        return res.redirect("/profile");
       // res.redirect(`/post/${postId}`);
    } catch (error) {
        console.error("Error saving post:", error);
        res.status(500).send("Error saving post");
    }
}

async function getCreationPin(req, res) {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user.username) {
            user.username = user.email.split("@")[0];
            await user.save();
        }

        const posts = await Post.find({ user: user._id }).sort({ createdate: -1 });
        const isEdit = req.query.edit === 'true';

        const profilePicture = user.profilepicture 
            ? `/images/uploads/${user.profilepicture}`
            : generateDefaultProfilePicture(user.username);

        res.render("pin-creation-tool", {
            profilepicture: profilePicture,
        });
    } catch (error) {
        handleError(res, "Error fetching user profile");
    }
}

async function profileUpdate(req, res) {
    try {
        const user = await getAuthenticatedUser(req);
        const { username } = req.body;

        // Validate inputs
        if (!username) {
            console.log(username)
            req.session.error = "Username is required.";
            return res.redirect("/profile");
        }

        if (req.file && isProfileCooldownActive(req.session.userId)) {
            console.log("Please wait before updating your profile picture again")
            req.session.error = "Please wait before updating your profile picture again.";
            return res.redirect("/profile");
        }

        if (req.file) {
            if (user.profilepicture) {
                const oldProfilePicturePath = path.join(__dirname, '..', 'public', 'images', 'profilepictures', user.profilepicture);

                if (fs.existsSync(oldProfilePicturePath)) {
                    try {
                        await fs.promises.unlink(oldProfilePicturePath);
                        console.log("Old profile picture deleted successfully.");
                    } catch (err) {
                        console.error("Error deleting old profile picture:", err);
                    }
                }
            }

            const optimizedFileName = await optimizeImage(req.file.path, 80, 400); // Resize for profile pictures
            user.profilepicture = optimizedFileName;

            // Remove the original uploaded file
            try {
                await fs.promises.unlink(req.file.path);
                console.log("Original uploaded file deleted successfully.");
            } catch (err) {
                console.error("Error deleting original uploaded file:", err);
            }
        }

        // Update the username if provided
        user.username = username;

        await user.save();
        console.log("User profile updated successfully.");
        req.session.success = "Profile updated successfully.";
        res.redirect("/profile");

    } catch (error) {
        console.error("Error in profile update:", error.message);
        handleError(res, "Error updating profile");
    }
}

function logout(req, res) {
    req.session.destroy((err) => {
        if (err) return handleError(res, "Error logging out");
        res.redirect("/login");
    });
}

module.exports = {
    ensureAuthenticated,
    login,
    signup,
    getHome,
    getProfile,
    profileUpdate,
    logout,
    getCreationPin,
    getPost,
    savePost,
};
