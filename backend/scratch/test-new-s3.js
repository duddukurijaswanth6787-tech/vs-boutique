const { S3Client, PutObjectCommand, GetBucketPolicyStatusCommand, GetPublicAccessBlockCommand } = require('@aws-sdk/client-s3');

// Use the new credentials
const s3 = new S3Client({
    region: 'ap-southeast-2',
    credentials: {
        accessKeyId: 'AKIAVZBUFMUU6YGVTPX7',
        secretAccessKey: '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'
    }
});

async function run() {
    const bucket = 'vs-boutique-web-images';
    console.log('Testing S3 Upload for new bucket:', bucket);

    try {
        const response = await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: 'test-upload-new.txt',
            Body: 'Hello World from new credentials test-upload script!',
            ContentType: 'text/plain'
        }));
        console.log('✅ Upload succeeded! Response:', response);
    } catch (e) {
        console.error('❌ Upload failed:', e.message);
    }

    try {
        const publicAccess = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
        console.log('\n--- PUBLIC ACCESS BLOCK STATUS ---');
        console.log(JSON.stringify(publicAccess.PublicAccessBlockConfiguration, null, 2));
    } catch (e) {
        console.log('Error getting Public Access Block:', e.message);
    }
}

run();
