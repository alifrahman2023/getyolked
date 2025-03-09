import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/LogPage.css"; // Import the CSS file
import FileDropzone from "./FileUpload";
import api from "./api"; // Import API instance

const LogPage = () => {
  const { date } = useParams();
  const [pushups, setPushups] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPushups = async () => {
      try {
        const response = await api.get(`/workouts/daily?date=${date}`);
        setPushups(response.data.total_pushups);
      } catch (error) {
        console.error("Error fetching push-ups:", error);
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
