import React, { useState } from "react";
import "../styles/DropZone.css"
import api from "./api"




const FileDropzone = ({ onFileUpload }) => {
    const [dragActive, setDragActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [fileName, setFileName] = useState("");
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


        const file = event.dataTransfer.files[0];
        validateFile(file);
    };


    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        validateFile(file);
    };


    const validateFile = (file) => {
        if (file) {
        const validTypes = ["video/mp4", "video/quicktime"]; // quicktime = .mov
        if (validTypes.includes(file.type)) {
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
    const handleClick= ()=>{
        setLoading(true);
        api.post("/api/predict");
    }
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


        <button onClick = { ()=> handleClick()}>
            Log Pushups
        </button>


        </div>
    );
};


export default FileDropzone;