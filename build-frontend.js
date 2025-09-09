const { execSync } = require('child_process');
const path = require('path');

// Change to frontend directory and build
process.chdir(path.join(__dirname, 'apps', 'frontend'));

try {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Frontend build completed successfully!');
} catch (error) {
  console.error('Frontend build failed:', error.message);
  process.exit(1);
}