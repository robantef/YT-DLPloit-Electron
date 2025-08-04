// debug-app.js - Quick debugging script
const path = require('path');
const fs = require('fs');

console.log('=== YT-DLPloit Debug Info ===');
console.log('Current directory:', __dirname);
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

// Check if built files exist
const clientDist = path.join(__dirname, 'client', 'dist');
const serverJs = path.join(__dirname, 'server', 'server.js');
const ytDlpBin = path.join(__dirname, 'bin', 'yt-dlp.exe');

console.log('\n=== File Checks ===');
console.log('Client dist exists:', fs.existsSync(clientDist));
if (fs.existsSync(clientDist)) {
  console.log('Client dist contents:', fs.readdirSync(clientDist));
}

console.log('Server exists:', fs.existsSync(serverJs));
console.log('yt-dlp binary exists:', fs.existsSync(ytDlpBin));

// Check if built app exists
const builtApp = path.join(__dirname, 'dist-electron', 'win-unpacked', 'YT-DLPloit.exe');
console.log('Built app exists:', fs.existsSync(builtApp));

console.log('\n=== To test manually ===');
console.log('1. Start server: cd server && node server.js');
console.log('2. Open browser: http://localhost:3001');
console.log('3. Test yt-dlp: bin\\yt-dlp.exe --version');
