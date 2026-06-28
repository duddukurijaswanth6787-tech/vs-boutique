const multer = require('multer');

const TYPE_FOLDERS = new Set(['logo', 'cover', 'gallery']);
const ALLOWED_IMAGE_TYPES = new Set(['jpeg', 'png', 'webp', 'svg']);
const hasAwsUploadConfig = Boolean(
    process.env.AWS_ACCESS_KEY &&
    process.env.AWS_SECRET_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_BUCKET_NAME
);

function detectImageType(buffer) {
    if (!buffer || buffer.length < 12) return null;
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'png';
    if (
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) return 'webp';
    const header = buffer.toString('utf8', 0, Math.min(buffer.length, 200));
    if (/^\s*<svg/i.test(header) || /^\s*<\?xml/i.test(header)) return 'svg';
    return null;
}

const resolveUploadType = (rawType) => {
    const normalizedType = (rawType || '').toLowerCase();
    return TYPE_FOLDERS.has(normalizedType) ? normalizedType : 'gallery';
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        cb(null, true);
    },
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    }
});

function validateFileType(buffer) {
    const detected = detectImageType(buffer);
    if (!detected || !ALLOWED_IMAGE_TYPES.has(detected)) {
        const err = new Error('Invalid file type. Only jpeg, png, webp, svg are allowed');
        err.statusCode = 400;
        throw err;
    }
    return detected;
}

module.exports = { upload, resolveUploadType, hasAwsUploadConfig, validateFileType, detectImageType };
