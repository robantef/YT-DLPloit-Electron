// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the path to the bundled yt-dlp binary
function getYtDlpPath() {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    // In development, use system yt-dlp
    return 'yt-dlp';
  }
  
  // In production, use bundled binary
  const platform = process.platform;
  const binDir = path.join(__dirname, '..', 'bin');
  const binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const binaryPath = path.join(binDir, binaryName);
  
  if (fs.existsSync(binaryPath)) {
    return `"${binaryPath}"`;
  }
  
  // Fallback to system yt-dlp
  console.warn('Bundled yt-dlp not found, falling back to system yt-dlp');
  return 'yt-dlp';
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the built React app
const isDev = process.env.NODE_ENV !== 'production';
if (!isDev) {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
}

// Analyze video endpoint
app.post('/analyze', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  // Clean URL by removing playlist and other parameters
  // Handle both ?list= and &list= formats
  let cleanUrl = url;
  if (cleanUrl.includes('?list=')) {
    cleanUrl = cleanUrl.split('?list=')[0];
  } else if (cleanUrl.includes('&list=')) {
    cleanUrl = cleanUrl.split('&list=')[0];
  }
  // Also remove any other parameters after &
  cleanUrl = cleanUrl.split('&')[0];

  // Get video info and formats
  const ytDlpPath = getYtDlpPath();
  exec(`${ytDlpPath} --dump-json "${cleanUrl}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('Error analyzing video:', stderr);
      return res.status(500).json({ error: 'Failed to analyze video' });
    }

    try {
      const videoData = JSON.parse(stdout);
      
      const info = {
        title: videoData.title || 'Unknown Title',
        thumbnail: videoData.thumbnail || '',
        duration: formatDuration(videoData.duration) || 'Unknown',
        uploader: videoData.uploader || 'Unknown',
        view_count: videoData.view_count || 0,
        upload_date: formatDate(videoData.upload_date) || 'Unknown'
      };

      const formats = videoData.formats || [];
      
      res.json({ info, formats });
    } catch (parseError) {
      console.error('Error parsing video data:', parseError);
      res.status(500).json({ error: 'Failed to parse video information' });
    }
  });
});

// Download endpoint
app.post('/download', (req, res) => {
  const { 
    url, 
    downloadType, 
    downloadThumbnail, 
    videoFormat, 
    audioFormat, 
    subtitleFormat,
    durationFrom,
    durationTo,
    videoTitle
  } = req.body;
  
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  // Clean URL by removing playlist and other parameters
  // Handle both ?list= and &list= formats
  let cleanUrl = url;
  if (cleanUrl.includes('?list=')) {
    cleanUrl = cleanUrl.split('?list=')[0];
  } else if (cleanUrl.includes('&list=')) {
    cleanUrl = cleanUrl.split('&list=')[0];
  }
  // Also remove any other parameters after &
  cleanUrl = cleanUrl.split('&')[0];

  let command = getYtDlpPath();
  
  // Sanitize video title for filename
  let filename;
  if (videoTitle) {
    filename = videoTitle
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
  }
  
  // Add output template with sanitized filename
  command += ` -o "downloads/${filename}.%(ext)s"`;
  
  // Add format selection based on download type
  if (downloadType === 'best') {
    // Use yt-dlp default behavior (no format specification)
    // This automatically selects the best available quality
  } else if (downloadType === 'video-only') {
    if (videoFormat) {
      command += ` -f "${videoFormat}"`;
    } else {
      command += ' -f "bestvideo[height<=1080]"';
    }
  } else if (downloadType === 'audio-only') {
    if (audioFormat) {
      command += ` -f "${audioFormat}"`;
    } else {
      command += ' -f "bestaudio"';
    }
  } else if (downloadType === 'custom') {
    // Custom format selection
    if (videoFormat && audioFormat) {
      command += ` -f "${videoFormat}+${audioFormat}"`;
    } else if (videoFormat) {
      command += ` -f "${videoFormat}"`;
    } else if (audioFormat) {
      command += ` -f "${audioFormat}"`;
    } else {
      command += ' -f "best[height<=1080]"'; // Fallback
    }
  } else {
    // Fallback for any other cases
    if (videoFormat && audioFormat) {
      command += ` -f "${videoFormat}+${audioFormat}"`;
    } else if (videoFormat) {
      command += ` -f "${videoFormat}"`;
    } else if (audioFormat) {
      command += ` -f "${audioFormat}"`;
    }
  }
  
  // Add thumbnail download
  if (downloadThumbnail) {
    command += ' --write-thumbnail';
  }
  
  // Add subtitle options (only for video downloads)
  if (subtitleFormat && downloadType !== 'audio-only') {
    if (subtitleFormat === 'auto') {
      command += ' --write-auto-sub --sub-lang en';
    } else {
      command += ` --write-sub --sub-lang ${subtitleFormat}`;
    }
  }
  
  // Add duration trimming
  if (durationFrom && durationTo) {
    command += ` --download-sections "*${durationFrom}-${durationTo}"`;
  } else if (durationFrom) {
    command += ` --download-sections "*${durationFrom}-"`;
  }
  
  // Add URL
  command += ` "${cleanUrl}"`;
  
  console.log('Executing command:', command);
  
  // Always handle as browser download
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Download error:', stderr);
      return res.status(500).json({ error: 'Download failed' });
    }
    
    // Use the filename we set in the output template
    const finalFilename = filename || 'download';
    
    // Check if file exists (may have different extension based on format)
    const downloadDir = 'downloads';
    if (fs.existsSync(downloadDir)) {
      const files = fs.readdirSync(downloadDir);
      const matchingFile = files.find(file => file.startsWith(finalFilename));
      
      if (matchingFile) {
        const actualFilePath = path.join(downloadDir, matchingFile);
        const stat = fs.statSync(actualFilePath);
        
        // Get file extension to determine MIME type
        const fileExtension = path.extname(matchingFile).toLowerCase();
        
        // Set appropriate MIME type based on extension for proper browser handling
        let mimeType = 'application/octet-stream';
        if (fileExtension === '.mp4') {
          mimeType = 'video/mp4';
        } else if (fileExtension === '.webm') {
          mimeType = 'video/webm';
        } else if (fileExtension === '.mp3') {
          mimeType = 'audio/mpeg';
        } else if (fileExtension === '.m4a') {
          mimeType = 'audio/mp4';
        } else if (fileExtension === '.ogg') {
          mimeType = 'audio/ogg';
        } else if (fileExtension === '.wav') {
          mimeType = 'audio/wav';
        }
        
        // Use the actual downloaded filename (which includes the extension)
        // Encode the filename to handle special characters and non-ASCII characters
        const encodedFilename = encodeURIComponent(matchingFile);
        
        // Create ASCII-safe filename for the quoted version (fallback for older browsers)
        const asciiSafeFilename = matchingFile.replace(/[^\x20-\x7E]/g, '_'); // Replace non-ASCII with underscore
        
        // Set headers with proper filename and MIME type for download
        // Use both formats for maximum browser compatibility
        res.setHeader('Content-Disposition', `attachment; filename="${asciiSafeFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', mimeType);
        
        const fileStream = fs.createReadStream(actualFilePath);
        fileStream.pipe(res);
        
        // Delete the file after sending
        fileStream.on('end', () => {
          fs.unlink(actualFilePath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
        });
        
        return;
      }
    }
    
    // Fallback if file parsing fails
    res.json({ 
      success: true, 
      message: 'Download completed successfully',
      output: stdout 
    });
  });
});

// Helper function to format duration from seconds
function formatDuration(seconds) {
  if (!seconds) return null;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to format upload date
function formatDate(dateString) {
  if (!dateString) return null;
  
  try {
    // yt-dlp date format is usually YYYYMMDD
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    return dateString;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve React app for all other routes (in production)
if (!isDev) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(3001, () => {
  console.log('🚀 Server listening on http://localhost:3001');
});
