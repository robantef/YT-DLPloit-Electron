// src/App.tsx
import { useState, useEffect } from "react";
import "./App.css";

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  view_count: number;
  upload_date: string;
}

interface Format {
  format_id: string;
  ext: string;
  resolution?: string;
  filesize?: number;
  vcodec?: string;
  acodec?: string;
  format_note?: string;
}

function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [formats, setFormats] = useState<Format[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<
    "loading" | "success" | "error" | ""
  >("");

  // Download options
  const [downloadType, setDownloadType] = useState<
    "best" | "video-only" | "audio-only" | "custom"
  >("best");
  const [downloadThumbnail, setDownloadThumbnail] = useState(false);
  const [selectedVideoFormat, setSelectedVideoFormat] = useState("");
  const [selectedAudioFormat, setSelectedAudioFormat] = useState("");
  const [selectedSubtitleFormat, setSelectedSubtitleFormat] = useState("");
  const [durationFrom, setDurationFrom] = useState("");
  const [durationTo, setDurationTo] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const analyzeVideo = async () => {
    if (!url.trim()) {
      setStatus("Please enter a YouTube URL");
      setStatusType("error");
      return;
    }

    setIsAnalyzing(true);
    setStatus("Analyzing video...");
    setStatusType("loading");
    setVideoInfo(null);
    setFormats([]);

    try {
      const response = await fetch("http://localhost:3001/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze video");
      }

      const data = await response.json();
      setVideoInfo(data.info);
      setFormats(data.formats);
      setStatus("Video analyzed successfully!");
      setStatusType("success");
    } catch (error) {
      setStatus("Failed to analyze video. Please check the URL and try again.");
      setStatusType("error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadVideo = async () => {
    if (!videoInfo) {
      setStatus("Please analyze a video first");
      setStatusType("error");
      return;
    }

    setIsDownloading(true);
    setStatus("Downloading...");
    setStatusType("loading");

    try {
      const downloadOptions = {
        url,
        downloadType,
        downloadThumbnail,
        videoFormat: selectedVideoFormat,
        audioFormat: selectedAudioFormat,
        subtitleFormat: selectedSubtitleFormat,
        durationFrom,
        durationTo,
        videoTitle: videoInfo.title, // Pass video title for filename
      };

      const response = await fetch("http://localhost:3001/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(downloadOptions),
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Check if this is a browser download (file response)
      const contentType = response.headers.get("content-type");
      console.log("Response Content-Type:", contentType); // Debug log
      if (
        contentType &&
        (contentType === "application/octet-stream" ||
          contentType.startsWith("video/") ||
          contentType.startsWith("audio/"))
      ) {
        // Handle browser download - force download, don't open in media player
        const blob = await response.blob();
        const contentDisposition = response.headers.get("content-disposition");
        let filename = videoInfo.title
          .replace(/[<>:"/\\|?*]/g, "_")
          .substring(0, 100); // Default to sanitized video title

        if (contentDisposition) {
          console.log("Content-Disposition:", contentDisposition); // Debug log
          // Try to extract filename from Content-Disposition header
          // Look for both filename="..." and filename*=UTF-8''...
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          const filenameStarMatch = contentDisposition.match(
            /filename\*=UTF-8''([^;]+)/
          );

          if (filenameMatch) {
            filename = filenameMatch[1];
            console.log("Using quoted filename:", filename); // Debug log
          } else if (filenameStarMatch) {
            filename = decodeURIComponent(filenameStarMatch[1]);
            console.log("Using encoded filename:", filename); // Debug log
          }
        }

        // Create download link that forces download instead of opening in browser
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        a.style.display = "none"; // Hide the link element

        // Force download by setting proper attributes
        a.setAttribute("download", filename);
        a.setAttribute("target", "_blank");

        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
        }, 100);

        setStatus("Download completed successfully!");
        setStatusType("success");
        setIsDownloading(false);
        return;
      }

      // If we get here, something went wrong
      setStatus("Download failed. Please try again.");
      setStatusType("error");
      setIsDownloading(false);
    } catch (error) {
      setStatus("Download failed. Please try again.");
      setStatusType("error");
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return Math.round((count / 1000000) * 10) / 10 + "M views";
    }
    if (count >= 1000) {
      return Math.round((count / 1000) * 10) / 10 + "K views";
    }
    return count + " views";
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765 1.582.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.515 2.515 0 0 0 1.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.831zM9.996 15.005l.005-6 5.207 3.005-5.212 2.995z" />
            </svg>
            YT-DLPloit
          </h1>
          <button className="theme-toggle" onClick={toggleTheme}>
            <svg className="icon" viewBox="0 0 24 24">
              {theme === "dark" ? (
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              )}
            </svg>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </header>

        <main className="main-card">
          <section className="url-input-section">
            <div className="input-group">
              <input
                type="text"
                className="url-input"
                placeholder="Enter YouTube URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && analyzeVideo()}
              />
              <button
                className="btn btn-primary"
                onClick={analyzeVideo}
                disabled={isAnalyzing}
              >
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </section>

          {status && (
            <div className={`status-message status-${statusType}`}>
              {status}
            </div>
          )}

          {videoInfo && (
            <>
              <section className="video-info">
                <div className="video-info-content">
                  <div className="video-thumbnail">
                    <div className="thumbnail-container">
                      {videoInfo.thumbnail ? (
                        <img
                          src={videoInfo.thumbnail}
                          alt="Video thumbnail"
                          className="thumbnail-img"
                        />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <svg className="icon" viewBox="0 0 24 24">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <label className="thumbnail-checkbox">
                        <input
                          type="checkbox"
                          checked={downloadThumbnail}
                          onChange={(e) =>
                            setDownloadThumbnail(e.target.checked)
                          }
                        />
                        Thumbnail
                      </label>
                    </div>
                  </div>
                  <div className="video-details">
                    <h2 className="video-title">{videoInfo.title}</h2>
                    <div className="video-meta">
                      <div className="meta-item">
                        <svg className="icon" viewBox="0 0 24 24">
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {videoInfo.uploader}
                      </div>
                      <div className="meta-item">
                        <svg className="icon" viewBox="0 0 24 24">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {formatViewCount(videoInfo.view_count)}
                      </div>
                      <div className="meta-item">
                        <svg className="icon" viewBox="0 0 24 24">
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {videoInfo.duration}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="download-options">
                <h3 className="section-title">
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Options
                </h3>

                <div className="download-best">
                  <label className="format-label">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Type
                  </label>
                  <select
                    className="format-select"
                    value={downloadType}
                    onChange={(e) =>
                      setDownloadType(
                        e.target.value as
                          | "best"
                          | "video-only"
                          | "audio-only"
                          | "custom"
                      )
                    }
                  >
                    <option value="best">Best Quality (Video + Audio)</option>
                    <option value="video-only">Video Only</option>
                    <option value="audio-only">Audio Only</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="format-options">
                  <div className="format-group">
                    <label className="format-label">
                      <svg className="icon" viewBox="0 0 24 24">
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Video Quality
                    </label>
                    <select
                      className="format-select"
                      value={selectedVideoFormat}
                      onChange={(e) => setSelectedVideoFormat(e.target.value)}
                      disabled={
                        downloadType === "best" || downloadType === "audio-only"
                      }
                    >
                      <option value="">Select video format</option>
                      {formats
                        .filter((f) => f.vcodec && f.vcodec !== "none")
                        .map((format) => (
                          <option
                            key={format.format_id}
                            value={format.format_id}
                          >
                            {format.resolution || format.format_note} -{" "}
                            {format.ext} ({formatFileSize(format.filesize)})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="format-group">
                    <label className="format-label">
                      <svg className="icon" viewBox="0 0 24 24">
                        <path d="M15.536 11.293l1.414 1.414a8 8 0 010 11.314l-1.414-1.414a6 6 0 000-8.486zM8.464 11.293a6 6 0 000 8.486L7.05 21.193a8 8 0 010-11.314l1.414 1.414zM12 7a5 5 0 100 10V7z" />
                      </svg>
                      Audio Quality
                    </label>
                    <select
                      className="format-select"
                      value={selectedAudioFormat}
                      onChange={(e) => setSelectedAudioFormat(e.target.value)}
                      disabled={
                        downloadType === "best" || downloadType === "video-only"
                      }
                    >
                      <option value="">Select audio format</option>
                      {formats
                        .filter(
                          (f) =>
                            f.acodec &&
                            f.acodec !== "none" &&
                            (!f.vcodec || f.vcodec === "none")
                        )
                        .map((format) => (
                          <option
                            key={format.format_id}
                            value={format.format_id}
                          >
                            {format.ext} - {format.format_note} (
                            {formatFileSize(format.filesize)})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="format-group">
                    <label className="format-label">
                      <svg className="icon" viewBox="0 0 24 24">
                        <path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                      Subtitles
                    </label>
                    <select
                      className="format-select"
                      value={selectedSubtitleFormat}
                      onChange={(e) =>
                        setSelectedSubtitleFormat(e.target.value)
                      }
                      disabled={
                        downloadType === "best" || downloadType === "audio-only"
                      }
                    >
                      <option value="">No subtitles</option>
                      <option value="en">English</option>
                      <option value="auto">Auto-generated</option>
                    </select>
                  </div>
                </div>

                <div className="duration-section">
                  <h4 className="format-label">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Duration (optional)
                  </h4>
                  <div className="duration-inputs">
                    <span>From:</span>
                    <input
                      type="text"
                      className="duration-input"
                      placeholder="00:00"
                      value={durationFrom}
                      onChange={(e) => setDurationFrom(e.target.value)}
                    />
                    <span>To:</span>
                    <input
                      type="text"
                      className="duration-input"
                      placeholder="Full video"
                      value={durationTo}
                      onChange={(e) => setDurationTo(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={downloadVideo}
                  disabled={isDownloading}
                  style={{ width: "100%" }}
                >
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {isDownloading ? "Downloading..." : "Start Download"}
                </button>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
