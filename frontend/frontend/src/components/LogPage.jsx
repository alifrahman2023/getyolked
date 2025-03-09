import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/LogPage.css"; // Import the CSS file
import FileDropzone from "./FileUpload";
import api from "./api"; // Import API instance

const LogPage = () => {
  const { date } = useParams();
  const [pushups, setPushups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPushups = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/workouts/daily?date=${date}`);
        if (response.data && typeof response.data.total_pushups === "number") {
          setPushups(response.data.total_pushups);
        } else {
          setPushups(0); // Default to 0 if response is unexpected
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

      <FileDropzone />
    </>
  );
};

export default LogPage;
