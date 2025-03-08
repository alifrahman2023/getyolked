import { useState } from 'react';
import { Link, Navigate, useNavigate } from'react-router-dom';
import "../styles/Form.css";
import axios from "axios"
import api from "./api";  

function Login() {
        const apiUrl = import.meta.env.VITE_BACK_URL;

        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [loading, setLoading] = useState(false);
        const [message, setMessage] = useState('');
        const navigate = useNavigate();

        const handleSubmit = async (e) => {
            e.preventDefault(); // Prevent page reload on form submit
            try {
            

            // Helper function to set cookies with specific options (including HttpOnly)
            function setCookie(name, value, maxAge = 3600) {
                // Check if we're in development mode
                const isDevelopment = window.location.hostname === "localhost"; // or check if you're in development via environment variables
                const secureFlag = isDevelopment ? "" : "secure";  // Set "secure" flag only if not in development
            
                document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; ${secureFlag}; samesite=Lax`;
            }
            if (password.length < 8 || email.length < 1 || password.length > 20) {
                setMessage("Incorrect or missing fields.");
                return;
            }
            setLoading(true);

            const response = await axios.post(`${apiUrl}/login`, {
                email: email,
                password: password,
            });
            console.log(response)
           
            localStorage.setItem("access_token", response.data.access_token);
        
            setMessage(response.data.message || "Login successful.");
            if (response.data.access_token){
                navigate("/")
            }
            } catch (err) {
            console.error(err);
            if (err.response.status === 401) {
                setMessage(err.response.data.detail);
                return;
            }
            else{
                setMessage("An error occurred. Please try again.");}
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
                <p className="title">Login</p>
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


                <button className="submit" type="submit">Submit</button>

                <p className="signin">
                Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
            )}
        </div>
        </div>
    );
}

export default Login;