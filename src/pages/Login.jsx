import React, { useState } from "react";
import "../css/Login.css";
import logoSrc from "../assets/secondjob.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : "")
).replace(/\/$/, "");

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = `${API_BASE || ""}/api/login`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        const user = data.user || {};
        const uid = user.id || user._id;

        if (uid) {
          localStorage.setItem("userId", uid);
        }
        if (user.fullName) {
          localStorage.setItem("userName", user.fullName);
        }

        toast.success(data.message || "Logged in successfully!");
        navigate("/jobs");
      } else {
        toast.error(data.error || data.message || "Login failed.");
      }
    } catch (err) {
      toast.error(
        "Network error. Check the backend URL and Vercel environment variables.",
      );
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
