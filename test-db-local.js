// Quick local test to verify Supabase connection
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: 'postgresql://postgres:xetvoz-6kaffi-ruzPiq@db.emkzjglkxshkhtcohngc.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to Supabase...');
    await client.connect();
    
    const result = await client.query('SELECT NOW(), current_database()');
    console.log('✅ SUCCESS! Connected to Supabase');
    console.log('📊 Database:', result.rows[0]);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
  }
}

testConnection();