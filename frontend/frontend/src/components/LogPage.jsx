import React from "react";
import { useParams } from "react-router-dom";
import "../styles/LogPage.css"; // Import the CSS file

const LogPage = () => {
  const { date } = useParams();

  // Fake log data (Replace this with actual logs from your backend)
  const logs = {
    "2025-3-8": ["Push-ups: 20 reps", "Squats: 10 reps"],
  };

  return (
    <div className="log-container">
      <h1 className="log-title">Workout Log for {date}</h1>
      {logs[date] ? (
        <ul className="log-list">
          {logs[date].map((log, index) => (
            <li key={index}>{log}</li>
          ))}
        </ul>
      ) : (
        <p className="no-log">No workouts logged.</p>
      )}
    </div>
  );
};

export default LogPage;
