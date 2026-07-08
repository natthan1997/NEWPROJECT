import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase credentials');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.R2_BUCKET_NAME || '';
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';

async function processUrl(url: string, prefix: string, id: string): Promise<string> {
  console.log(`Downloading: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
     console.error(`Failed to download ${url}: ${response.status}`);
     return url;
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
  const newPath = `${prefix}/${id}-${Date.now()}-${Math.floor(Math.random()*1000)}.${ext}`;
  
  await r2.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: newPath,
    Body: buffer,
    ContentType: response.headers.get('content-type') || 'application/octet-stream',
  }));
  
  const newUrl = `${publicUrl}/${newPath}`;
  console.log(`✅ Uploaded to R2: ${newUrl}`);
  return newUrl;
}

async function run() {
  console.log('--- Migrating documents ---');
  
  const { data: documents, error } = await supabase.from('documents').select('*');
  if (error || !documents) return console.error(error);
  
  let migratedCount = 0;
  // Regex to find Supabase URLs
  const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/[a-zA-Z0-9_\-\.\/]+/g;

  for (const doc of documents) {
    let changed = false;
    let newDescription = doc.description;
    let newFileUrl = doc.file_url;
    
    // Check file_url
    if (newFileUrl && newFileUrl.includes('.supabase.co/storage/')) {
       newFileUrl = await processUrl(newFileUrl, 'migrated-documents', doc.id);
       if (newFileUrl !== doc.file_url) changed = true;
    }
    
    // Check description JSON string
    if (newDescription && typeof newDescription === 'string') {
      const matches = newDescription.match(urlRegex);
      if (matches && matches.length > 0) {
         // Create a unique set to avoid downloading same URL multiple times for one doc
         const uniqueUrls = Array.from(new Set(matches));
         for (const oldUrl of uniqueUrls) {
            const newUrl = await processUrl(oldUrl, 'migrated-documents', doc.id);
            if (newUrl !== oldUrl) {
               // Replace all occurrences in the JSON string
               newDescription = newDescription.split(oldUrl).join(newUrl);
               changed = true;
            }
         }
      }
    }
    
    if (changed) {
      console.log(`Updating record ${doc.id}...`);
      const { error: updateError } = await supabase.from('documents').update({
        file_url: newFileUrl,
        description: newDescription
      }).eq('id', doc.id);
      
      if (updateError) {
        console.error(`Failed to update ${doc.id}:`, updateError);
      } else {
        migratedCount++;
      }
    }
  }

  console.log(`\n--- ALL DONE ---`);
  console.log(`Successfully migrated ${migratedCount} documents records.`);
}

run().catch(console.error);
