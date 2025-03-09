import React, { useEffect, useState } from "react";
import api from "./api"; // Import your axios instance
import Calendar from "./Calendar";

function Home() {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);


  return (
    <div>
      <h1>Get Yolked</h1>

      
        <Calendar/>
      
    </div>
  );
}

export default Home;
