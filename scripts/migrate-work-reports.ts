import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  if (!url || !url.includes('.supabase.co/storage/')) return url;
  
  console.log(`Downloading: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
     console.error(`Failed to download ${url}: ${response.status}`);
     return url; // keep old if failed
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
  console.log('--- Migrating work_reports ---');
  
  const { data: reports, error } = await supabase.from('work_reports').select('*');
  
  if (error || !reports) {
    console.error('Error fetching work_reports:', error);
    return;
  }
  
  let migratedCount = 0;

  for (const report of reports) {
    let changed = false;
    
    // Process before_photos
    const newBefore = [];
    for (const url of (report.before_photos || [])) {
      const newUrl = await processUrl(url, 'migrated-work-reports', report.id);
      if (newUrl !== url) changed = true;
      newBefore.push(newUrl);
    }
    
    // Process after_photos
    const newAfter = [];
    for (const url of (report.after_photos || [])) {
      const newUrl = await processUrl(url, 'migrated-work-reports', report.id);
      if (newUrl !== url) changed = true;
      newAfter.push(newUrl);
    }
    
    // Process zones
    const newZones = [];
    for (const zone of (report.zones || [])) {
       let zoneChanged = false;
       const nz = { ...zone };
       
       if (Array.isArray(nz.before_photos)) {
          const zb = [];
          for (const url of nz.before_photos) {
            const newUrl = await processUrl(url, 'migrated-work-reports', report.id);
            if (newUrl !== url) zoneChanged = true;
            zb.push(newUrl);
          }
          nz.before_photos = zb;
       }
       
       if (Array.isArray(nz.after_photos)) {
          const za = [];
          for (const url of nz.after_photos) {
            const newUrl = await processUrl(url, 'migrated-work-reports', report.id);
            if (newUrl !== url) zoneChanged = true;
            za.push(newUrl);
          }
          nz.after_photos = za;
       }
       
       if (Array.isArray(nz.photos)) {
          const zp = [];
          for (const url of nz.photos) {
            const newUrl = await processUrl(url, 'migrated-work-reports', report.id);
            if (newUrl !== url) zoneChanged = true;
            zp.push(newUrl);
          }
          nz.photos = zp;
       }
       
       if (zoneChanged) changed = true;
       newZones.push(nz);
    }
    
    if (changed) {
      console.log(`Updating record ${report.id}...`);
      const { error: updateError } = await supabase.from('work_reports').update({
        before_photos: newBefore,
        after_photos: newAfter,
        zones: newZones
      }).eq('id', report.id);
      
      if (updateError) {
        console.error(`Failed to update ${report.id}:`, updateError);
      } else {
        migratedCount++;
      }
    }
  }

  console.log(`\n--- ALL DONE ---`);
  console.log(`Successfully migrated ${migratedCount} work_reports records.`);
}

run().catch(console.error);
