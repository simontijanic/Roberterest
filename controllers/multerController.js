const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../images/uploads');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

async function optimizeImage(filePath, qualityValue, resizeWidth = 800) {
    const uploadDir = path.join(__dirname, '..', 'images', 'uploads');
    const sanitizedFilename = `optimized-${Date.now()}-${path.basename(filePath).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.-_]/g, '')}`;
    const outputFilePath = path.join(uploadDir, sanitizedFilename);

    await sharp(filePath)
        .resize(resizeWidth)
        .toFormat('jpeg')
        .jpeg({ quality: qualityValue })
        .toFile(outputFilePath);

    return sanitizedFilename;
}

function sanitizeFileName(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const sanitizedFilename = `optimized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${path.basename(filePath).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.-_]/g, '')}`;
    return sanitizedFilename;
}

module.exports = { upload, optimizeImage, sanitizeFileName };
