import React from 'react';
import Chatbot from "./Chatbot";
import Calendar from "./Calendar"


const activityData={
  3:1,
  5:2,
  10:3,
  15:4,
  20:2,
  25:1
}
const getData = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: 'sample input' }), // Send some data, if needed
      });
      const data = await response.json();
      console.log(data);  // Log the prediction or result returned by Flask
    } catch (error) {
      console.error('Error:', error);  // Handle any errors
    }
};

const Home = () => {
    // getData();
    return (
    <div>
        <h1>Get yolked</h1>
        <Calendar activityData={activityData}/>
        
    </div>
    );
}

export default Home;