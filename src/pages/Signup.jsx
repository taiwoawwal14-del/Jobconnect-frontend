import React, { useState } from "react";
import "../css/Signup.css";
import logoSrc from "../assets/secondjob.png";
import { useNavigate } from "react-router-dom";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : "")
).replace(/\/$/, "");

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
      const url = `${API_BASE || ""}/api/signup`;
      const res = await fetch(url, {
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

        const user = data.user || {};
        const uid = user.id || user._id;

        if (uid) {
          localStorage.setItem("userId", uid);
        }
        if (user.fullName) {
          localStorage.setItem("userName", user.fullName);
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
          "Network error. Check the deployed backend URL and Vercel environment variables.",
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
