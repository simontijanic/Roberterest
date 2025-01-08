const User = require("../models/userModel");

exports.getRegister = (req, res) => {
    res.render("register");
}

exports.postRegister = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate user input
    if (!username || !password) {
      return res.status(400).send("Username and password are required.");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("User already exists.");
    }

    // Create a new user
    const newUser = new User({ username, password });
    await newUser.save();

    // Redirect to login page after successful registration
    res.redirect("/login");
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).send("Error during registration.");
  }
};

exports.getLogin = (req, res) => {
  const error = req.session.error || null;
  req.session.error = null;
  res.render("login", { error });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate user input
    if (!username || !password) {
      return res.status(400).send("Username and password are required.");
    }

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send("User not found.");
    }

    // Check if the password matches
    const isMatch = await user.comparePassword(password); // Assuming you have a comparePassword method on your User model
    if (!isMatch) {
      return res.status(400).send("Incorrect password.");
    }

    // Set up session for the logged-in user
    req.session.userId = user._id;
    req.session.username = user.username;

    // Redirect to the home page after successful login
    res.redirect("/home");
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send("Error during login.");
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error during logout.");
    }
    res.redirect("/login");
  });
};
