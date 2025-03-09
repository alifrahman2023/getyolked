import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logout from "./Logout.js";
import "../styles/NavBar.css";

function NavBar({ children }) {
  

  
  return (
    <div className="WhatHoldsEverything">
      <header className={`header `}>
        <nav className="nav-container">
    
          <ul className="nav-menu">
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