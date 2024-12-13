const path = require("path");
const sharp = require("sharp");
const fs = require("fs").promises;

// Function to optimize image before upload
exports.optimizeImage = async (filePath, qualityValue, resizeWidth = 800) => {
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

// Function to delete file
exports.deleteFile = async (filePath) => {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log("File deleted:", filePath);
  } catch (err) {
    console.error("Error deleting file:", err.message);
  }
}
