const router = require('express').Router();
const { ensureAuthenticated, getProfile } = require("../handlers/authHandler");
const { createPost } = require("../handlers/uploadHandler");

const upload = require("../controllers/multerController");

router.post('/upload', ensureAuthenticated, upload.single('file'), createPost);

module.exports = router;
