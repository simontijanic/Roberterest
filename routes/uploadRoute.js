const router = require('express').Router();
const { ensureAuthenticated, getProfile } = require("../handlers/authHandler");
const { createPost, deletePost } = require("../handlers/uploadHandler");

const upload = require("../controllers/multerController");

router.post('/upload', ensureAuthenticated, upload.single('file'), createPost);
router.post('/upload/:id/delete', ensureAuthenticated, deletePost);

module.exports = router;
