// registrationRoute.js
const router = require("express").Router();
const authHandler = require("../controllers/authController");
const registrationController = require("../controllers/registrationController");

// Route for rendering the registration page
router.get("/register", registrationController.getRegister);

// Route for handling registration form submission
router.post("/register", registrationController.postRegister);

// Route for rendering the login page
router.get("/login", registrationController.getLogin);

// Route for handling login form submission
router.post("/login", registrationController.postLogin);

// Logout route
router.post("/logout", registrationController.logout);

module.exports = router;
