const router = require('express').Router();
const authHandler = require("../handlers/authHandler");
const upload = require("../controllers/multerController");

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

router.get("/", ensureAuthenticated, (req, res) => res.redirect("/home"));

router.get("/home", ensureAuthenticated, getHome);

router.get('/post/:postId', ensureAuthenticated, getPost);
router.post("/post/:postId/save", ensureAuthenticated, savePost);

router.get("/pin-creation-tool", ensureAuthenticated, getCreationPin);

router.get("/profile", ensureAuthenticated, getProfile);
router.post(
    "/profile/update",
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
