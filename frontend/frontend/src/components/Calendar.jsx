import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Calendar.css";
import api from "./api"; // Import API instance

const Calendar = () => {
  const navigate = useNavigate();
  const today = new Date();
  const currentYear = today.getFullYear();

  // State for the displayed month and activity data
  const [month, setMonth] = useState(today.getMonth());
  const [activityData, setActivityData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const firstDay = new Date(currentYear, month, 1).getDay();
  const totalDays = new Date(currentYear, month + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Fetch workout data when the month changes
  useEffect(() => {
    const fetchWorkoutData = async () => {
      setLoading(true);
      setLoading(false)
      setError(null);
      try {
        const response = await api.get(`/workouts/monthly?year=${currentYear}&month=${month+1}`);
        console.log("Calendar response:", response.data);

        if (!response.data || typeof response.data !== "object") {
          throw new Error("Invalid response format");
        }

        setActivityData(response.data);
      } catch (err) {
        console.error("Error fetching workout data:", err);
        setError("Failed to load workout data");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [month]); // Re-fetch when `month` changes

  // Check if a day has activity data
  const isActive = (day) => activityData && activityData[day] > 0;

  // Handle day clicks
  const handleDayClick = (day) => {
    const formattedDate = `${currentYear}-${month + 1}-${day}`;
    navigate(`/log/${formattedDate}`);
  };

  // Navigate between months
  const prevMonth = () => {
    if (month > 0) setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month < 11) setMonth(month + 1);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevMonth} disabled={month === 0}>←</button>
        <h2>{new Date(currentYear, month).toLocaleString("default", { month: "long" })} {currentYear}</h2>
        <button onClick={nextMonth} disabled={month === 11}>→</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          <div className="calendar-weekdays">
            <div className="calendar-weekday">Mon</div>
            <div className="calendar-weekday">Tue</div>
            <div className="calendar-weekday">Wed</div>
            <div className="calendar-weekday">Thu</div>
            <div className="calendar-weekday">Fri</div>
            <div className="calendar-weekday">Sat</div>
            <div className="calendar-weekday">Sun</div>
          </div>

          <div className="calendar-grid">
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-cell empty"></div>
            ))}
            {days.map((day) => (
              <div
                key={day}
                className={`calendar-cell ${isActive(day) ? "active" : ""}`}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Calendar;
