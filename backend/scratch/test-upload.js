const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: './.env' });

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

async function run() {
    const bucket = process.env.AWS_BUCKET_NAME;
    console.log('Testing S3 Upload to bucket:', bucket);

    try {
        const response = await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: 'test-upload-file.txt',
            Body: 'Hello World from test-upload script!',
            ContentType: 'text/plain'
        }));
        console.log('✅ Upload succeeded! Response:', response);
    } catch (e) {
        console.error('❌ Upload failed:', e.message);
    }
}

run();
