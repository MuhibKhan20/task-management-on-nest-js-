require('dotenv').config();
const { query } = require('../config/database');

async function checkUsers() {
  try {
    console.log('Checking all users in the database...\n');

    // Get all users with their roles
    const allUsers = await query(`
      SELECT id, username, email, role, "createdAt"
      FROM "User"
      ORDER BY "createdAt" ASC
    `);

    console.log(`Total users found: ${allUsers.rows.length}\n`);

    if (allUsers.rows.length === 0) {
      console.log('No users found in the database!');
      return;
    }

    // Group users by role
    const usersByRole = {};
    allUsers.rows.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    // Display users grouped by role
    Object.keys(usersByRole).forEach(role => {
      console.log(`=== ${role} USERS (${usersByRole[role].length}) ===`);
      usersByRole[role].forEach(user => {
        console.log(`  ID: ${user.id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Created: ${user.createdAt}`);
        console.log('  ---');
      });
      console.log('');
    });

    // Show what the API would return for assignable users (updated query)
    console.log('=== ASSIGNABLE USERS (role != ADMIN) ===');
    const assignableUsers = await query(
      'SELECT id, username, email FROM "User" WHERE role != $1 ORDER BY username ASC',
      ['ADMIN']
    );

    if (assignableUsers.rows.length === 0) {
      console.log('❌ No non-admin users found!');
      console.log('This is why the dropdown shows "No users found"');
    } else {
      console.log(`✅ Found ${assignableUsers.rows.length} assignable users:`);
      assignableUsers.rows.forEach(user => {
        console.log(`  - ${user.username} (${user.email})`);
      });
    }

  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers()
  .then(() => {
    console.log('\nUser check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('User check failed:', error);
    process.exit(1);
  });