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

async function migrateTable(tableName: string, colName: string, idCol: string = 'id', folderPrefix: string = 'migrated') {
  console.log(`\n--- Migrating table: ${tableName} ---`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select(`${idCol}, ${colName}`)
    .not(colName, 'is', null)
    .like(colName, '%.supabase.co/storage/%');

  if (error || !data) {
    console.log(`No records or error in ${tableName}.`);
    return { migrated: 0, failed: 0 };
  }

  let migrated = 0;
  let failed = 0;

  for (const item of data as any[]) {
    const url = item[colName];
    try {
      console.log(`Migrating ID ${item[idCol]}...`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      
      const buffer = Buffer.from(await response.arrayBuffer());
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
      const newPath = `${folderPrefix}/${tableName}-${item[idCol]}-${Date.now()}.${ext}`;
      
      await r2.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: newPath,
        Body: buffer,
        ContentType: response.headers.get('content-type') || 'application/octet-stream',
      }));
      
      const newUrl = `${publicUrl}/${newPath}`;
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [colName]: newUrl })
        .eq(idCol, item[idCol]);
        
      if (updateError) throw updateError;
      
      console.log(`✅ Success: ${newUrl}`);
      migrated++;
    } catch (e: any) {
      console.error(`❌ Failed ID ${item[idCol]}: ${e.message}`);
      failed++;
    }
  }
  
  return { migrated, failed };
}

async function run() {
  let totalMigrated = 0;
  let totalFailed = 0;

  const results = await Promise.all([
    migrateTable('houses', 'image_url', 'id', 'migrated-houses'),
    migrateTable('plant_library_variants', 'image_url', 'id', 'migrated-plants')
  ]);

  for (const res of results) {
    totalMigrated += res.migrated;
    totalFailed += res.failed;
  }

  console.log('\n--- ALL DONE ---');
  console.log(`Total migrated this run: ${totalMigrated}`);
  console.log(`Total failed: ${totalFailed}`);
}

run().catch(console.error);
