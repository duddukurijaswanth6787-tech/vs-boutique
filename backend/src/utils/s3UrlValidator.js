/**
 * Boutique / design images must be HTTPS object URLs on this project's S3 bucket.
 * Empty string is allowed (optional images).
 */
function isAllowedS3ImageUrl(v) {
    if (v == null || v === '') return true;
    if (typeof v !== 'string') return false;
    if (v.startsWith('data:')) return false;
    if (!v.startsWith('https://')) return false;
    
    // Strict S3 domain check
    const region = process.env.AWS_REGION || 'ap-south-1';
    if (!v.includes(`.s3.${region}.amazonaws.com`)) return false;
    
    const bucket = process.env.AWS_BUCKET_NAME;
    if (bucket && !v.includes(bucket)) return false;
    
    return true;
}

function isAllowedS3ImageUrlArray(arr) {
    if (!Array.isArray(arr)) return true;
    return arr.every(isAllowedS3ImageUrl);
}

module.exports = { isAllowedS3ImageUrl, isAllowedS3ImageUrlArray };
