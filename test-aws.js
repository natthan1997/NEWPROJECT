const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
async function run() {
  try {
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
    })
    await r2Client.send(new PutObjectCommand({Bucket: 'test', Key: 'test', Body: 'test'}))
  } catch (e) {
    console.log("Error during send:", e.message)
  }
}
run()
