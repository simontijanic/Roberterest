const router = require('express').Router();
const authHandler = require("../handlers/authHandler");
const uploadHandler = require("../handlers/uploadHandler");

const { ensureAuthenticated } = authHandler;
const { validatePostData, createPost, deletePost } = uploadHandler;
const { upload, optimizeImage, sanitizeFileName } = require("../controllers/multerController");

router.post(
    '/upload',
    ensureAuthenticated,
    upload.single('file'),  // Then, upload the file
    validatePostData,    // First, validate the data
    createPost           // Finally, create the post
);

router.post('/upload/:id/delete', ensureAuthenticated, deletePost);

module.exports = router;
