// server-routes.js - Express routes extracted from server.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = function(app, getYtDlpPath) {

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

  // Analyze video endpoint
  app.post('/analyze', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    // Clean URL by removing playlist and other parameters
    let cleanUrl = url;
    if (cleanUrl.includes('?list=')) {
      cleanUrl = cleanUrl.split('?list=')[0];
    } else if (cleanUrl.includes('&list=')) {
      cleanUrl = cleanUrl.split('&list=')[0];
    }
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

    // Clean URL
    let cleanUrl = url;
    if (cleanUrl.includes('?list=')) {
      cleanUrl = cleanUrl.split('?list=')[0];
    } else if (cleanUrl.includes('&list=')) {
      cleanUrl = cleanUrl.split('&list=')[0];
    }
    cleanUrl = cleanUrl.split('&')[0];

    let command = getYtDlpPath();
    
    // Sanitize video title for filename
    let filename;
    if (videoTitle) {
      filename = videoTitle
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
    }
    
    // Add output template with sanitized filename
    command += ` -o "downloads/${filename}.%(ext)s"`;
    
    // Add format selection based on download type
    if (downloadType === 'best') {
      // Use yt-dlp default behavior
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
      if (videoFormat && audioFormat) {
        command += ` -f "${videoFormat}+${audioFormat}"`;
      } else if (videoFormat) {
        command += ` -f "${videoFormat}"`;
      } else if (audioFormat) {
        command += ` -f "${audioFormat}"`;
      } else {
        command += ' -f "best[height<=1080]"';
      }
    }
    
    // Add thumbnail download
    if (downloadThumbnail) {
      command += ' --write-thumbnail';
    }
    
    // Add subtitle options
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
    
    // Execute download
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error('Download error:', stderr);
        return res.status(500).json({ error: 'Download failed' });
      }
      
      const finalFilename = filename || 'download';
      
      // Check if file exists
      const downloadDir = 'downloads';
      if (fs.existsSync(downloadDir)) {
        const files = fs.readdirSync(downloadDir);
        const matchingFile = files.find(file => file.startsWith(finalFilename));
        
        if (matchingFile) {
          const actualFilePath = path.join(downloadDir, matchingFile);
          const stat = fs.statSync(actualFilePath);
          
          // Set appropriate MIME type
          const fileExtension = path.extname(matchingFile).toLowerCase();
          let mimeType = 'application/octet-stream';
          if (fileExtension === '.mp4') {
            mimeType = 'video/mp4';
          } else if (fileExtension === '.webm') {
            mimeType = 'video/webm';
          } else if (fileExtension === '.mp3') {
            mimeType = 'audio/mpeg';
          } else if (fileExtension === '.m4a') {
            mimeType = 'audio/mp4';
          }
          
          const encodedFilename = encodeURIComponent(matchingFile);
          const asciiSafeFilename = matchingFile.replace(/[^\x20-\x7E]/g, '_');
          
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
      
      res.json({ 
        success: true, 
        message: 'Download completed successfully',
        output: stdout 
      });
    });
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
  });
};
