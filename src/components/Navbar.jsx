import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Navbar.css";
import navLogo from "../assets/jobconnect.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const jobsTarget = userId ? "/jobs" : "/signup";
  const chatTarget = userId ? "/chat" : "/signup";
  const profileTarget = userId ? "/profile" : "/signup";

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="jc-navbar">
      <div className="jc-container">
        <div className="jc-brand">
          <Link to="/" className="jc-brand-link" onClick={closeMenu}>
            <img src={navLogo} alt="JobConnect" className="jc-logo" />
            <span className="jc-brand-text">JobConnect</span>
          </Link>
        </div>

        <button
          className={`jc-hamburger ${open ? "open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`jc-nav ${open ? "open" : ""}`}>
          <Link to="/" className="jc-nav-link" onClick={closeMenu}>
            Home
          </Link>
          <Link to={jobsTarget} className="jc-nav-link" onClick={closeMenu}>
            Jobs
          </Link>
          <Link to={chatTarget} className="jc-nav-link" onClick={closeMenu}>
            Chat
          </Link>
          <Link to={profileTarget} className="jc-nav-link" onClick={closeMenu}>
            Profile
          </Link>
          {!userId && (
            <>
              <Link
                to="/signup"
                className="jc-nav-link jc-cta"
                onClick={closeMenu}
              >
                Sign Up
              </Link>
              <Link to="/login" className="jc-nav-link" onClick={closeMenu}>
                Log In
              </Link>
            </>
          )}
          {userId && (
            <button
              className="jc-nav-link jc-cta"
              onClick={() => {
                localStorage.removeItem("userId");
                closeMenu();
                navigate("/");
              }}
            >
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
