import React, { useEffect, useState } from "react";
import api from "./api"; // Import your axios instance
import Calendar from "./Calendar";

function Home() {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);


  return (
    <div>
      <h1>
        <span style={{ color: '#f0ead6' }}>Get </span> <span style={{ color: 'gold' }}>Yolk</span><span style={{ color: '#f0ead6' }}>ed</span>
      </h1>

      
        <Calendar/>
      
    </div>
  );
}

export default Home;
