import React, { useEffect, useState } from "react";
import api from "./api"; // Import your axios instance
import Calendar from "./Calendar";

function Home() {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkoutData = async () => {
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // JS months are 0-based

        const response = await api.get(`/workouts/monthly?year=${year}&month=${month}`);
        setActivityData(response.data);
      } catch (error) {
        console.error("Error fetching workout data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, []);

  return (
    <div>
      <h1>Get Yolked</h1>

      {loading ? (
        <h2>Loading...</h2>
      ) : (
        <Calendar activityData={activityData} />
      )}
    </div>
  );
}

export default Home;
