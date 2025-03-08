import { useState } from 'react';
import axios from 'axios';
import "../styles/Form.css";
import {Link} from "react-router-dom";
import api from "../components/api.js"

function Register() {
  const apiUrl = import.meta.env.VITE_BACK_URL;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload on form submit
    console.log(password)
    console.log(confirmPassword)
    setMessage("")
    try {
      if (localStorage.getItem('access_token') || localStorage.getItem('refresh_token') || localStorage.getItem("user_id")){
        localStorage.clear()
      }
    

      if (password !== confirmPassword) {
        setMessage("Passwords do not match");
        return;
      }
    //   if (password.length < 8 || firstName.length < 1 || lastName.length < 1 || email.length < 1) {
    //     setMessage("Password must be at least 8 characters or there are missing fields.");
    //     return;
    //   }
      if (password.length > 20 || firstName.length > 20 || lastName.length > 20) {
        setMessage("Password must be less than 20 characters");
        return;
      }
      setLoading(true);
      const response = await axios.post(`${apiUrl}/signup`, {
        email: email,
        password: password,
      });
      console.log("Response: ", response)

      setMessage(response.data.message || "User created successfully!");
    } catch (err) {
      console.error(err);
      setMessage(err.response.data.message);

    } finally {
      setLoading(false);

      
     
    }
  };

  return (
    <div className= "formPageContainer">
      <div className="form-container">
        {loading ? (
          <h1>Loading...</h1>
        ) : (
          <form className="form" onSubmit={handleSubmit}>
            <p className="title">Register</p>
            {message && <p className="message">{message}</p>} {/* Ensure message is conditionally rendered */}


            <label>
              <input
                required
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
              />
              <span>Email</span>
            </label>

            <label>
              <input
                required
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
              />
              <span>Password</span>
            </label>

            <label>
              <input
                required
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder=""
              />
              <span>Confirm Password</span>
            </label>

            <button className="submit" type="submit">Submit</button>

            <p className="signin">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default Register;