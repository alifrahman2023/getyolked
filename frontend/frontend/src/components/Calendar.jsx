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

  // Check if a day has activity data
  const isActive = (day) => activityData[day] > 0;

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
    </div>
  );
};

export default Calendar;
