import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/LogPage.css"; // Import the CSS file
import FileDropzone from "./FileUpload";
import api from "./api"; // Import API instance

// Component to display video and its timeline
const VideoTimeline = ({ videoUrl, labels }) => {
  // Calculate even width for each label block as a percentage.
  const blockWidth = `${100 / labels.length}%`;

  return (
    <div 
      className="video-timeline-container" 
      style={{ marginBottom: "20px", width: "320px" }}
    >
      <video style={{ width: "100%" }} controls src={videoUrl}></video>
      <div
        className="timeline"
        style={{
          width: "100%",
          marginTop: "8px",
          display: "flex",
        }}
      >
        {labels.map((label, index) => (
          <span
            key={index}
            className="timeline-block"
            style={{
              width: blockWidth,
              height: "10px",
              backgroundColor: label === 1 ? "green" : "red",
            }}
          ></span>
        ))}
      </div>
    </div>
  );
};

const LogPage = () => {
  const { date } = useParams();
  const [pushups, setPushups] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format today's date as "YYYY-M-D"
  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  useEffect(() => {
    const fetchPushups = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/workouts/daily?date=${date}`);
        if (response.data && typeof response.data.total_pushups === "number") {
          setPushups(response.data.total_pushups);
        } else {
          setPushups(0);
        }
        if (response.data && response.data.videos) {
          setVideos(response.data.videos);
        }
      } catch (error) {
        console.error("Error fetching push-ups:", error);
        setError("Failed to fetch push-ups. Please try again.");
        setPushups(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPushups();
  }, [date]);

  return (
    <>
      <div className="log-container">
        <h1 className="log-title">Workout Log for {date}</h1>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <ul className="log-list">
            <li>Push-ups: {pushups} reps</li>
          </ul>
        )}
      </div>

      {/* Videos rendered outside the log container */}
      <div
        className="videos-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "2rem",
          marginTop: "0px",
          backgroundColor: "black",
          padding: "2rem",
          borderRadius: "10px"
        }}
      >
        {videos.map((videoObj, index) => (
          <VideoTimeline
            key={index}
            videoUrl={videoObj.video_url}
            labels={videoObj.labels}
          />
        ))}
      </div>

      {/* Only show the file upload if the page's date matches today's date */}
      {date === formattedToday && <FileDropzone />}
    </>
  );
};

export default LogPage;
