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

router.post(
  "/upload",
  ensureAuthenticated,
  upload.single("file"),
  validatePostData,
  createPost
);

router.post("/upload/:id/delete", ensureAuthenticated, deletePost);

module.exports = router;
