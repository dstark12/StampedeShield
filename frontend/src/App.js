import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";
import WebSocketHandler from "./WebSocketHandler"; // ✅ Import WebSocketHandler

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [heatmapURL, setHeatmapURL] = useState(null);
  const [progress, setProgress] = useState(0);
  const [peopleCount, setPeopleCount] = useState(0);
  const [latestFrame, setLatestFrame] = useState(null);
  const [quadrantCounts, setQuadrantCounts] = useState({}); // New state for 12-quadrant data

  const originalVideoRef = useRef(null);
  const heatmapVideoRef = useRef(null);

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a video file.");
      return;
    }

    setLoading(true);
    setResult(null);
    setPeopleCount(0);
    setProgress(0);
    
    // Keep the original video URL
    setVideoURL(URL.createObjectURL(selectedFile));

    const formData = new FormData();
    formData.append("video", selectedFile);

    try {
      const response = await axios.post("http://127.0.0.1:8000/detect/", formData);
      setResult(response.data);
      setHeatmapURL(response.data.heatmap_video_url || "https://www.w3schools.com/html/mov_bbb.mp4");
      
      // Reset video time to 0 when processing is done
      if (originalVideoRef.current) {
        originalVideoRef.current.currentTime = 0;
      }
      if (heatmapVideoRef.current) {
        heatmapVideoRef.current.currentTime = 0;
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("An error occurred while processing the video.");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      {/* WebSocket Handler for Real-time Frames and Quadrant Data */}
      <WebSocketHandler
        setLatestFrame={setLatestFrame}
        setPeopleCount={setPeopleCount}
        setProgress={setProgress}
        setCurrentFrame={() => {}} // Not needed for now
        setQuadrantCounts={setQuadrantCounts} // New prop for quadrant counts
      />

      <header>
        <h1>Stampede Shield 🛡️</h1>
        <p>Upload a video to analyze crowd movement and density.</p>
      </header>

      <div className="upload-section">
        <input
          type="file"
          accept="video/*"
          className="file-input"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button onClick={handleFileUpload} disabled={loading} className="upload-btn">
          {loading ? "Processing..." : "Upload & Analyze"}
        </button>
      </div>

      {loading && <p className="loading-text">Analyzing video... Please wait.</p>}

      <div className="progress-section">
        <h3>Processing Progress: {progress}%</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <h2>Total People Detected in Frame: {peopleCount}</h2>

      {/* New Section: Live Quadrant Counts */}
      <div className="quadrant-section">
        <h3>Live Quadrant Counts (12 Regions):</h3>
        {Object.keys(quadrantCounts).length > 0 ? (
          <div className="quadrant-grid">
            {Object.entries(quadrantCounts).map(([key, value]) => (
              <div key={key} className="quadrant-cell">
                <p>{key}: {value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No quadrant data available yet</p>
        )}
      </div>

      {/* Live Frames (TOP - Side by Side) */}
      <div className="video-frame-section">
        <div className="video-container">
          <h3>Live Processed Frame</h3>
          {latestFrame ? (
            <img src={latestFrame} alt="Processed Frame" className="frame-preview" />
          ) : (
            <p>No live frame available yet</p>
          )}
        </div>
      </div>

      {/* Heatmap & Original Video (BOTTOM - Side by Side) */}
      <div className="video-processing-section">
        {/* Original Video (Bottom Left) */}
        {videoURL && (
          <div className="video-container">
            <h3>Original Uploaded Video</h3>
            <video ref={originalVideoRef} src={videoURL} controls autoPlay muted className="video-player" />
          </div>
        )}

        {/* AI Heatmap Video (Bottom Right) */}
        {heatmapURL && (
          <div className="video-container">
            <h3>AI Generated Heatmap</h3>
            <video ref={heatmapVideoRef} src={heatmapURL} controls autoPlay muted className="video-player" />
          </div>
        )}
      </div>

      {result && (
        <div className="result-section">
          <h2>Final Detection Results 📊</h2>
          <div className="result-content">
            <p><strong>Total People Detected:</strong> {result.total_people_detected}</p>
            <p><strong>Average People Per Frame:</strong> {result.average_people_per_frame}</p>
            <p><strong>Processing Time:</strong> {result.processing_time_seconds} sec</p>
          </div>
          {result.avg_quadrant_counts && (
            <div className="quadrant-result">
              <h3>Average Quadrant Counts:</h3>
              {Object.entries(result.avg_quadrant_counts).map(([key, value]) => (
                <p key={key}>{key}: {value.toFixed(2)}</p>
              ))}
              <h3>Quadrant Alerts:</h3>
              {result.quadrant_alerts && Object.entries(result.quadrant_alerts).map(([key, value]) => (
                <p key={key}>{key}: {value ? "Overcrowded" : "Safe"}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
