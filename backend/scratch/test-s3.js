const { S3Client, GetPublicAccessBlockCommand, GetBucketPolicyStatusCommand, GetBucketPolicyCommand } = require('@aws-sdk/client-s3');
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
    console.log('Testing S3 Bucket:', bucket);

    try {
        const publicAccess = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
        console.log('\n--- PUBLIC ACCESS BLOCK STATUS ---');
        console.log(JSON.stringify(publicAccess.PublicAccessBlockConfiguration, null, 2));
    } catch (e) {
        console.log('Error getting Public Access Block:', e.message);
    }

    try {
        const policyStatus = await s3.send(new GetBucketPolicyStatusCommand({ Bucket: bucket }));
        console.log('\n--- BUCKET POLICY STATUS ---');
        console.log('IsPublic:', policyStatus.PolicyStatus.IsPublic);
    } catch (e) {
        console.log('Error getting Bucket Policy Status:', e.message);
    }

    try {
        const policy = await s3.send(new GetBucketPolicyCommand({ Bucket: bucket }));
        console.log('\n--- BUCKET POLICY ---');
        console.log(policy.Policy);
    } catch (e) {
        console.log('Error getting Bucket Policy:', e.message);
    }
}

run();
