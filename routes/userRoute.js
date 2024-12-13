// userRoute.js
const router = require("express").Router();
const authHandler = require("../controllers/authController");
const creationToolLimiter = require("../middlewares/limiterMW");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { upload } = require("../utils/multerUtils");
const User = require("../models/userModel");

// LOGIC for Passport and Google OAuth Strategy
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

// Routes for User Actions
router.get("/", authHandler.ensureAuthenticated, creationToolLimiter, (req, res) => res.redirect("/home"));

router.get("/home", authHandler.ensureAuthenticated, creationToolLimiter, authHandler.getHome);

router.get("/post/:postId", authHandler.ensureAuthenticated, creationToolLimiter, authHandler.getPost);
router.post("/post/:postId/save", authHandler.ensureAuthenticated, creationToolLimiter, authHandler.savePost);

router.get("/pin-creation-tool", authHandler.ensureAuthenticated, creationToolLimiter, authHandler.getCreationPin);

router.get("/profile", authHandler.ensureAuthenticated, creationToolLimiter, authHandler.getProfile);

router.post(
  "/profile/update",
  authHandler.ensureAuthenticated,
  creationToolLimiter,
  upload.single("profilepicture"),
  authHandler.profileUpdate
);

router.post("/logout", creationToolLimiter, authHandler.logout);

// Google Authentication Routes
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
