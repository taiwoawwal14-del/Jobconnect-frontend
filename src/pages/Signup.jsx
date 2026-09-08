import React, { useState } from "react";
import "../css/Signup.css";
import logoSrc from "../assets/secondjob.png";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://jobconnect-backend-9q6l.onrender.com";

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: "success",
          message: data.message || "Account created successfully.",
        });
        setFullName("");
        setEmail("");
        setPassword("");
        // store only userId in localStorage and redirect to jobs
        if (data.user && (data.user.id || data.user._id)) {
          const uid = data.user.id || data.user._id;
          localStorage.setItem("userId", uid);
        }
        navigate("/jobs");
      } else {
        setStatus({
          type: "error",
          message: data.error || data.message || "Signup failed.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message:
          "Network error. Please check if your Express backend is running on port 3000.",
      });
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
          <h2>Create your account</h2>
          {status.message && (
            <div
              className={`msg-box ${
                status.type === "success" ? "msg-success" : "msg-error"
              }`}
            >
              {status.message}
            </div>
          )}

          <label>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

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
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
