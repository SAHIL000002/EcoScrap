const fs = require('fs');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

class ImageService {
  /**
   * Upload single file either to Cloudinary or serve locally
   */
  static async uploadImage(file, folder = 'kabadiwala') {
    if (!file) return null;

    if (isCloudinaryConfigured) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `kabadiwala_connect/${folder}`,
          resource_type: 'image'
        });
        // Remove temp file from disk
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return result.secure_url;
      } catch (err) {
        console.warn('[ImageService] Cloudinary upload failed, falling back to local file:', err.message);
      }
    }

    // Local file fallback
    const relativePath = `/uploads/${file.filename}`;
    return relativePath;
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleImages(files, folder = 'kabadiwala') {
    if (!files || files.length === 0) return [];
    const urls = [];
    for (const file of files) {
      const url = await ImageService.uploadImage(file, folder);
      if (url) urls.push(url);
    }
    return urls;
  }
}

module.exports = ImageService;
