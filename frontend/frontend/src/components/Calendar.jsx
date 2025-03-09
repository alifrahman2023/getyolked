import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Calendar.css";

const Calendar = ({ activityData }) => {
  const navigate = useNavigate();

  const today = new Date();
  const currentYear = today.getFullYear();

  // State to track displayed month and year
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(currentYear, month, 1).getDay();
  const totalDays = new Date(currentYear, month + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const getActivityLevel = (day) => activityData[day] || 0;

  // Function to handle clicks on days
  const handleDayClick = (day) => {
    const formattedDate = `${currentYear}-${month + 1}-${day}`; // e.g., "2025-03-08"
    navigate(`/log/${formattedDate}`);
  };

  // Handle month navigation
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
      <div className="calendar-grid">
        {Array(firstDay).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-cell empty"></div>
        ))}
        {days.map((day) => (
          <div
            key={day}
            className={`calendar-cell level-${getActivityLevel(day)}`}
            onClick={() => handleDayClick(day)}
            style={{ cursor: "pointer" }}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
