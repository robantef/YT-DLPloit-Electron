// Test script to verify yt-dlp integration
const { exec } = require('child_process');

console.log('Testing yt-dlp integration...');

// Test basic yt-dlp command
exec('yt-dlp --version', (err, stdout, stderr) => {
  if (err) {
    console.error('❌ yt-dlp not found or not working:', err.message);
    return;
  }
  console.log('✅ yt-dlp version:', stdout.trim());
  
  // Test JSON output with a simple video
  console.log('Testing JSON output...');
  exec('yt-dlp --dump-json --no-download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"', { timeout: 30000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Failed to get video info:', stderr);
      return;
    }
    
    try {
      const data = JSON.parse(stdout);
      console.log('✅ Successfully parsed video data:');
      console.log('Title:', data.title);
      console.log('Duration:', data.duration + ' seconds');
      console.log('Uploader:', data.uploader);
      console.log('Format count:', data.formats?.length || 0);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError.message);
    }
  });
});
