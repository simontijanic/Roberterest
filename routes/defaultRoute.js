const router = require('express').Router();
const authHandler = require("../handlers/authHandler");
const validationController = require("../controllers/validationController")
const rateLimit = require('express-rate-limit');

const { upload, optimizeImage, sanitizeFileName } = require("../controllers/multerController");

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, 
    message: "Too many requests from this IP, please try again after 15 minutes."
});

const {
    ensureAuthenticated,
    login,
    signup,
    getHome,
    getProfile,
    profileUpdate,
    logout,
    getPost,
    savePost,
    getCreationPin
} = authHandler;

router.use((req, res, next) => {
    res.locals.currentPath = req.path;  // Set the current path
    next();
});


router.get("/", ensureAuthenticated, (req, res) => res.redirect("/home"));

router.get("/home", ensureAuthenticated, getHome);

router.get('/post/:postId', ensureAuthenticated, getPost);
router.post("/post/:postId/save", ensureAuthenticated, savePost);

router.get("/pin-creation-tool", ensureAuthenticated, getCreationPin);

router.get("/profile", ensureAuthenticated, getProfile);
router.post(
    "/profile/update",
    limiter,
    ensureAuthenticated,
    upload.single("profilepicture"), 
    profileUpdate,
    
);

router.get("/login", (req, res) => {
    const error = req.session.error || null; 
    req.session.error = null; 
    res.render("login", { error });
});
router.post("/login", login);

router.get("/signup", (req, res) => {
    const error = req.session.error || null; 
    req.session.error = null; 
    res.render("signup", { error });
});
router.post("/signup", signup);

router.post("/logout", logout);

module.exports = router;
