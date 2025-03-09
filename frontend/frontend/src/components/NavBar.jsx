import { Link } from "react-router-dom";
import logout from "./Logout.js";
import "../styles/NavBar.css";

function NavBar({ children }) {
  return (
    <div>
      <header className="header">
        <nav className="nav-container">
          {/* Logo and Home link on the left */}
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/">
                <img src="/logo.png" alt="Logo" className="logo" />
              </Link>            
            </li>
          </ul>
          {/* Logout on the right */}
          <ul className="nav-menu">
            <li className="logout">
              <a onClick={() => logout()} className="nav-link">Logout</a>
            </li>
          </ul>
        </nav>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}

export default NavBar;
