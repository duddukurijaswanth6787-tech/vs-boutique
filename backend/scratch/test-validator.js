const { isAllowedS3ImageUrl } = require('../src/utils/s3UrlValidator');
require('dotenv').config({ path: './.env' });

console.log('Testing S3 URL Validator with current configuration...');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);

const testUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/logo/test.png`;
console.log('Test URL:', testUrl);

const isValid = isAllowedS3ImageUrl(testUrl);
console.log('Is valid URL?', isValid);

if (isValid) {
    console.log('✅ Validator test passed!');
} else {
    console.error('❌ Validator test failed!');
}
