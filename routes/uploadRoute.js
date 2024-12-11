const router = require("express").Router();
const authHandler = require("../controllers/userController");
const uploadHandler = require("../controllers/uploadController");

const { ensureAuthenticated } = authHandler;
const { validatePostData, createPost, deletePost } = uploadHandler;
const {
  upload,
  optimizeImage,
  sanitizeFileName,
} = require("../utils/multerController");


router.post(
  "/upload",
  ensureAuthenticated,
  upload.single("file"),
  validatePostData,
  createPost
);

router.post("/upload/:id/delete", ensureAuthenticated, deletePost);

module.exports = router;
