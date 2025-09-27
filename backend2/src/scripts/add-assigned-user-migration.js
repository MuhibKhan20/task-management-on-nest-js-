require('dotenv').config();
const { query } = require('../config/database');

async function addAssignedUserColumn() {
  try {
    console.log('Starting migration: Add assignedUserId column to Card table...');

    // Check if column already exists
    const columnCheck = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Card' AND column_name = 'assignedUserId'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('Column assignedUserId already exists in Card table');
      return;
    }

    // Add assignedUserId column
    await query(`
      ALTER TABLE "Card"
      ADD COLUMN "assignedUserId" TEXT REFERENCES "User"(id) ON DELETE SET NULL
    `);

    console.log('Successfully added assignedUserId column to Card table');
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addAssignedUserColumn()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addAssignedUserColumn;