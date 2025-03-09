import React, { useState } from "react";
import "../styles/DropZone.css";
import api from "./api";

const FileDropzone = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files[0];
    validateFile(droppedFile);
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    validateFile(selectedFile);
  };

  const validateFile = (file) => {
    if (file) {
      const validTypes = ["video/mp4", "video/quicktime"]; // quicktime = .mov
      if (validTypes.includes(file.type)) {
        setFile(file);
        setFileName(file.name);
        setErrorMessage("");
        if (onFileUpload) {
          onFileUpload(file);
        }
      } else {
        setErrorMessage("Invalid file type. Please upload an MP4 or MOV video.");
        setFileName("");
      }
    }
  };

  const uploadFile = async () => {
    if (!file) return alert("Please select a file first.");

    setLoading(true);
    try {
      // Create FormData and append the video file.
      const formData = new FormData();
      formData.append("video", file);

      // Post the formData directly to the /api/predict endpoint.
      const { data } = await api.post("/api/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("File uploaded and processed successfully!\n" + data.message);
      // Optionally, you can do something with the returned data (pushup count, videoUrl, etc.)
      console.log("Response:", data);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div
        className={`file-dropbox ${dragActive ? "drag-active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>Drag & drop a video file here or click to upload</p>
        <input
          type="file"
          accept=".mp4, .mov"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          id="fileInput"
        />
      </div>
      <label htmlFor="fileInput" className="file-dropbox-label">
        Click to select a file
      </label>
      {fileName && <p className="file-info">Selected file: {fileName}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button onClick={uploadFile} disabled={loading}>
        {loading ? "Uploading..." : "Upload & Log Pushups"}
      </button>
    </div>
  );
};

export default FileDropzone;
