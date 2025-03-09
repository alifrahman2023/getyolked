import { useState } from "react";
import axios from "axios";

const Chatbot = () => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const sendMessage = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/chat", { message });
      setResponse(res.data.response);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error getting response from chatbot.");
    }
  };

  return (
    <div>
      <h2>Gemini Chatbot</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
      <p>Response: {response}</p>
    </div>
  );
};

export default Chatbot;