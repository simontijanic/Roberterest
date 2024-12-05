const router = require("express").Router();
const authHandler = require("../handlers/authHandler");
const uploadHandler = require("../handlers/uploadHandler");

const { ensureAuthenticated } = authHandler;
const { validatePostData, createPost, deletePost } = uploadHandler;
const {
  upload,
  optimizeImage,
  sanitizeFileName,
} = require("../controllers/multerController");

const creationToolLimiter = require("../controllers/limiterController")

router.post(
  "/upload",
  ensureAuthenticated,
  creationToolLimiter,
  upload.single("file"),
  validatePostData,
  createPost
);

router.post("/upload/:id/delete", ensureAuthenticated, creationToolLimiter, deletePost);

module.exports = router;
