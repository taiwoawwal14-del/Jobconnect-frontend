import React, { useState } from "react";
import "../css/Login.css";
import logoSrc from "../assets/secondjob.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Logged in successfully!");
        // store only userId in localStorage and redirect to jobs
        if (data.user && (data.user.id || data.user._id)) {
          const uid = data.user.id || data.user._id;
          localStorage.setItem("userId", uid);
        }
        navigate("/jobs");
      } else {
        toast.error(data.error || data.message || "Login failed.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <div className="auth-layout">
        <div className="auth-visual">
          <img src={logoSrc} alt="JobConnect" />
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Log In</h2>

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}

