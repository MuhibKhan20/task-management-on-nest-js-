require('dotenv').config();
const { query } = require('../config/database');

async function checkSchema() {
  try {
    console.log('Checking database schema...');

    // Check User table structure
    const userSchema = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position
    `);

    console.log('\nUser table structure:');
    userSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check Card table structure
    const cardSchema = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Card'
      ORDER BY ordinal_position
    `);

    console.log('\nCard table structure:');
    cardSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

checkSchema()
  .then(() => {
    console.log('\nSchema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema check failed:', error);
    process.exit(1);
  });