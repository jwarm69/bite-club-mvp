// Test with IPv4 forcing and SSL
const { Client } = require('pg');
const dns = require('dns');
const { promisify } = require('util');
const resolve4 = promisify(dns.resolve4);

async function testConnection() {
  try {
    // First resolve the IPv4 address
    console.log('🔍 Resolving IPv4 address for db.emkzjglkxshkhtcohngc.supabase.co...');
    const addresses = await resolve4('db.emkzjglkxshkhtcohngc.supabase.co');
    console.log('📍 IPv4 addresses:', addresses);
    
    // Try connection with SSL required (Supabase requires this)
    const client = new Client({
      host: addresses[0], // Use IPv4 address
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'xetvoz-6kaffi-ruzPiq',
      ssl: { rejectUnauthorized: false }
    });

    console.log('🔄 Connecting to Supabase via IPv4...');
    await client.connect();
    
    const result = await client.query('SELECT NOW(), current_database()');
    console.log('✅ SUCCESS! Connected to Supabase');
    console.log('📊 Database:', result.rows[0]);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();