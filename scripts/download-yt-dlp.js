// scripts/download-yt-dlp.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const YTDLP_VERSION = 'latest'; // or specify a version like '2023.12.30'
const binDir = path.join(__dirname, '..', 'bin');

// Create bin directory if it doesn't exist
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${dest}`);
    
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function downloadYtDlp() {
  try {
    const platform = process.platform;
    let fileName, downloadUrl;

    if (platform === 'win32') {
      fileName = 'yt-dlp.exe';
      downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/${YTDLP_VERSION}/download/yt-dlp.exe`;
    } else if (platform === 'darwin') {
      fileName = 'yt-dlp';
      downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/${YTDLP_VERSION}/download/yt-dlp_macos`;
    } else {
      fileName = 'yt-dlp';
      downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/${YTDLP_VERSION}/download/yt-dlp`;
    }

    const filePath = path.join(binDir, fileName);
    
    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`yt-dlp already exists at ${filePath}`);
      return;
    }

    await downloadFile(downloadUrl, filePath);
    
    // Make executable on Unix-like systems
    if (platform !== 'win32') {
      fs.chmodSync(filePath, '755');
    }
    
    console.log('yt-dlp downloaded successfully!');
  } catch (error) {
    console.error('Failed to download yt-dlp:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  downloadYtDlp();
}

module.exports = { downloadYtDlp };
