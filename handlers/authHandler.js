const User = require("../models/userModel");
const Post = require("../models/postModel");

const bcrypt = require("bcrypt");

function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect("/login");
    }
}

const validatePassword = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
};

async function login(req, res) {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render("login", { error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render("login", { error: "Invalid credentials" });
        }

        req.session.userId = user._id; 

        res.redirect("/home");
    } catch (error) {
        console.error(error);
        res.render("login", { error: "An error occurred during login" });
    }
}

async function getHome(req, res) {
    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        if (!user.username) {
            const expectedTrimmedEmail = user.email.split("@")[0];
            user.username = expectedTrimmedEmail;
        }

        
        const posts = await Post.find().sort({ createdate: -1 }); 
        res.render("home", { posts, profilepicture: `/images/uploads/${user.profilepicture}` }); 

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("An error occurred while fetching the profile.");
    }
}

function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error logging out");
        }
        res.redirect("/login");
    });
}


async function signup(req, res) {
    const { email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.render("signup", { error: "Passwords do not match" });
    }
    if (!validatePassword(password)) {
        return res.render("signup", { error: "Password must be at least 8 characters long and contain a number and a special character"});
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("signup", { error: "Email is already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.redirect("/login");
    } catch (error) {
        console.error(error);
        res.render("signup", { error: "An error occurred during sign-up. Please try again." });
    }

}

async function getProfile(req, res) {
    try {
        console.log("Session User ID:", req.session.userId);
        const user = await User.findById(req.session.userId);
        console.log("User in database:", user);
        
        if (!user) {
            return res.status(404).send("User not found");
        }

        if (!user.username) {
            const expectedTrimmedEmail = user.email.split("@")[0];
            user.username = expectedTrimmedEmail;
        }


        const posts = await Post.find({ user: user._id }).sort({ createdate: -1 });
   //     console.log("Posts found:", posts);

        const isEdit = req.query.edit === 'true';

        res.render("profile", { email: user.email, username: user.username, profilepicture: `/images/uploads/${user.profilepicture}`, isEdit: isEdit, user: user, posts: posts });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("An error occurred while fetching the profile.");
    }
}





async function profileEdit(req, res) {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        user.username = req.body.username || user.username;
        
        if (req.file) {
            user.profilepicture = req.file.filename;
        }

        await user.save();

        res.redirect("/profile");
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).send("An error occurred while updating the profile.");
    }
}

async function profileUpdate(req, res) {
    try {
        console.log('Request Body:', req.body);
        console.log('Uploaded File:', req.file);  // Now this should correctly log the file object

        // Ensure the user is authenticated
        if (!req.session.userId) {
            return res.status(400).send("User is not authenticated.");
        }

        // Get the user from the database
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        const { username } = req.body;

        // Determine the uploaded image or fallback to the existing profile picture
        const uploadedImage = req.file ? req.file.filename : user.profilepicture || 'default-profile.jpg';

        const updatedFields = {
            username: username,  // Update username if provided
            profilepicture: uploadedImage  // Update profile picture if a new file was uploaded
        };

        // Update the user's profile in the database
        await User.findByIdAndUpdate(req.session.userId, updatedFields);

        res.redirect("/profile");  // Redirect to the profile page after the update
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Error updating profile");
    }
}

module.exports = {
    ensureAuthenticated,
    login,
    logout,
    signup,
    getProfile,
    profileEdit,
    profileUpdate,
    getHome,
}