import api from "../components/api";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logout from "./Logout";

function ProtectedRoute({ children }) {
  const apiUrl = import.meta.env.VITE_BACK_URL;
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const verifyTokens = async () => {
    const token = localStorage.getItem("access_token")

    if (token != null){
        setIsAuthenticated(true)
    } else{
        setIsAuthenticated(false)
    }
    };

    verifyTokens();
  }, [apiUrl]); // Ensuring effect runs when apiUrl changes

  // Render nothing while verifying authentication
  if (isAuthenticated === null) {
    return null;
  }

  //If not authenticated, redirect to login
  if (!isAuthenticated) {
    logout();  // Redirect instead of rendering Logout
  }

  // If authenticated, render protected children
  return children;
}

export default ProtectedRoute;