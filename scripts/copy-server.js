// scripts/copy-server.js
const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  
  const files = fs.readdirSync(from);
  
  files.forEach(file => {
    const fromPath = path.join(from, file);
    const toPath = path.join(to, file);
    const stat = fs.statSync(fromPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'downloads') {
        copyFolderSync(fromPath, toPath);
      }
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

// Copy server files to the build directory
const serverSource = path.join(__dirname, '..', 'server');
const serverDest = path.join(__dirname, '..', 'server');

console.log('Server files are already in place.');
console.log('Make sure to run "npm install" in the server directory before building.');

// Ensure downloads directory exists
const downloadsDir = path.join(serverSource, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
  console.log('Created downloads directory');
}
