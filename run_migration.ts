import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const sql = fs.readFileSync('migrations/20260718020000_add_cover_and_language_fields.sql', 'utf8');
        await client.query(sql);
        console.log("Migration successful");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
