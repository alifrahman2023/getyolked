import React from 'react';
import Chatbot from "./components/Chatbot";

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
        <h1>Welcome to My React App</h1>
    </div>
    );
}

export default Home;