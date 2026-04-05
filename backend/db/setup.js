// ============================================================
//  db/setup.js  —  Run ONCE to create all database tables
//  Usage: node db/setup.js
// ============================================================
require('dotenv').config({ path: '../.env' });
const { db, schema } = require('./index');

async function setup() {
  try {
    console.log('🔧 Connecting to database...');
    await db.none(schema);
    console.log('✅ All tables created successfully!');
    console.log('   Tables: users, agents, calls');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    console.error('   Check your DATABASE_URL in .env');
    process.exit(1);
  }
}

setup();
