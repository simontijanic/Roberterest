const router = require("express").Router();
const authHandler = require("../handlers/authHandler");
const validationController = require("../controllers/validationController");

const User = require("../models/userModel");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const creationToolLimiter = require("../controllers/limiterController")

const {
  upload,
  optimizeImage,
  sanitizeFileName,
} = require("../controllers/multerController");

const {
  ensureAuthenticated,
  getHome,
  getProfile,
  profileUpdate,
  logout,
  getPost,
  savePost,
  getCreationPin,
} = authHandler;

// LOGIC \\

router.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET_ID,
      callbackURL: "/auth/google/callback",
      scope: ["profile"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const newUser = {
          googleId: profile.id,
          username: profile.displayName,
        };

        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          done(null, user);
        } else {
          user = await User.create(newUser);
          done(null, user);
        }
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id); 
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

router.get("/", ensureAuthenticated, creationToolLimiter, (req, res) => res.redirect("/home"));

router.get("/home", ensureAuthenticated, creationToolLimiter, getHome);

router.get("/post/:postId", ensureAuthenticated, creationToolLimiter, getPost);
router.post("/post/:postId/save", ensureAuthenticated, creationToolLimiter, savePost);

router.get("/pin-creation-tool", ensureAuthenticated, creationToolLimiter, getCreationPin);

router.get("/profile", ensureAuthenticated, creationToolLimiter, getProfile);
router.post(
  "/profile/update",
  ensureAuthenticated,
  creationToolLimiter,
  upload.single("profilepicture"),
  profileUpdate
);

router.get("/login", creationToolLimiter, (req, res) => {
  const error = req.session.error || null;
  req.session.error = null;
  res.render("login", { error });
});

router.post("/logout", creationToolLimiter, logout);

router.get(
  "/auth/google",
  creationToolLimiter,
  passport.authenticate("google", { scope: ["profile"] })
);

router.get(
  "/auth/google/callback",
  creationToolLimiter,
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/");
  }
);

module.exports = router;

// http://roberterest.megatron.ikt-fag.no/termsofservice
// http://roberterest.megatron.ikt-fag.no/policy
