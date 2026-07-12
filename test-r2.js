require('dotenv').config({ path: '.env.local' })
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

async function run() {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: 'test/upload.txt',
      Body: 'Hello World',
      ContentType: 'text/plain',
    })
    await r2Client.send(command)
    console.log('Upload success')
  } catch(e) {
    console.error('Error:', e.message)
  }
}
run()
