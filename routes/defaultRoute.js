const router = require('express').Router();
const authHandler = require("../handlers/authHandler");
const { ensureAuthenticated, getProfile, profileEdit, profileUpdate } = require("../handlers/authHandler");
const Post = require("../models/postModel");

const upload = require("../controllers/multerController");

router.get("/", ensureAuthenticated);

router.get("/home", ensureAuthenticated, async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdate: -1 }); 
        res.render("home", { posts }); 
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send("An error occurred while fetching posts.");
      }    
});

router.get("/profile", ensureAuthenticated, getProfile);
router.post('/profile/update', ensureAuthenticated,upload.single('profilepicture'), profileUpdate);
router.post('/profile/edit', ensureAuthenticated, profileEdit);

router.get("/login", (req, res) => res.render("login", { error: null }));
router.post("/login", authHandler.login);

router.get("/signup", (req, res) => res.render("signup", { error: null }));
router.post("/signup", authHandler.signup);

router.post("/logout", authHandler.logout);

module.exports = router;
