import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logout from "./Logout.js";
import "../styles/NavBar.css";

function NavBar({ children }) {
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Check if the user is at the top of the page
      setIsAtTop(window.pageYOffset === 0);
    };

    window.addEventListener("scroll", handleScroll);
    // Clean up the event listener on component unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="WhatHoldsEverything">
      <header className={`header ${isAtTop ? "at-top" : ""}`}>
        <nav className="nav-container">
          <Link to="/" className="logo">
            Email Dashboard
          </Link>
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/services" className="nav-link">
                Services
              </Link>
            </li>
            <li className="nav-item">
              <a onClick={() => logout()}>Logout</a>
            </li>
          </ul>
        </nav>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}

export default NavBar;