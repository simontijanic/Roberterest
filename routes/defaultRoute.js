const router = require('express').Router();
const authHandler = require("../handlers/authHandler");
const { ensureAuthenticated, getProfile, profileEdit, profileUpdate, getHome } = require("../handlers/authHandler");

const upload = require("../controllers/multerController");

router.get("/", ensureAuthenticated);

router.get("/home", ensureAuthenticated, getHome);
router.get("/pin-creation-tool", ensureAuthenticated, async (req, res) => {res.render("pin-creation-tool")})

router.get("/profile", ensureAuthenticated, getProfile);
router.post('/profile/update', ensureAuthenticated,upload.single('profilepicture'), profileUpdate);
router.post('/profile/edit', ensureAuthenticated, profileEdit);


router.get("/login", (req, res) => res.render("login", { error: null }));
router.post("/login", authHandler.login);

router.get("/signup", (req, res) => res.render("signup", { error: null }));
router.post("/signup", authHandler.signup);

router.post("/logout", authHandler.logout);

module.exports = router;
