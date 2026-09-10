import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Jobs.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const emptyForm = {
  title: "",
  company: "",
  description: "",
  salary: "",
  location: "",
  workType: "Full-time",
  paymentFrequency: "Monthly",
  requirements: "",
};

export default function Jobs() {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId");
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedJob, setHighlightedJob] = useState(null);
  const [activeTab, setActiveTab] = useState("findJobs");
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem("jobconnect-saved-jobs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    localStorage.setItem("jobconnect-saved-jobs", JSON.stringify(savedJobs));
  }, [savedJobs]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function fetchJobs() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/jobs`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePost(e) {
    e.preventDefault();
    const poster = localStorage.getItem("userId");
    if (!poster) {
      navigate("/login");
      return;
    }

    const requiredValues = Object.values(form).filter(
      (value) => typeof value === "string" && value.trim(),
    );
    if (requiredValues.length < 7) {
      return;
    }

    setPosting(true);
    try {
      const payload = {
        ...form,
        poster,
      };

      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create job");
      }

      const job = await res.json();
      setJobs((s) => [job, ...s]);
      setHighlightedJob(job);
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  }

  async function handleRemove(id) {
    if (!id) return;
    const currentUser = localStorage.getItem("userId");
    if (!currentUser) return;

    try {
      const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Delete failed");
      }
      setJobs((s) => s.filter((j) => j._id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleMessage(job) {
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    const posterId = job.poster?._id || job.poster;
    if (!posterId || posterId === currentUserId) {
      return;
    }

    const displayName =
      job.poster?.fullName ||
      job.poster?.username ||
      job.company ||
      "This person";

    navigate(
      `/chat?recipientId=${posterId}&displayName=${encodeURIComponent(displayName)}`,
    );
  }

  function toggleSavedJob(job) {
    setSavedJobs((prev) => {
      const exists = prev.some((item) => item._id === job._id);
      if (exists) {
        return prev.filter((item) => item._id !== job._id);
      }
      return [job, ...prev];
    });
  }

  const savedIds = new Set(savedJobs.map((job) => job._id));

  const filtered = jobs.filter((job) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const searchable = [
      job.title,
      job.company,
      job.location,
      job.workType,
      job.paymentFrequency,
      job.requirements || "",
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });

  const tabJobs =
    activeTab === "saved"
      ? jobs.filter((job) => savedIds.has(job._id))
      : activeTab === "myPosts"
        ? jobs.filter(
            (job) => (job.poster?._id || job.poster) === currentUserId,
          )
        : filtered;

  const getPosterId = (job) => job.poster?._id || job.poster || null;
  const canDeleteJob = (job) =>
    currentUserId && getPosterId(job) === currentUserId;
  const canMessageJob = (job) =>
    currentUserId && getPosterId(job) !== currentUserId;

  return (
    <div className="jobs-page form-page">
      <div className="jobs-topbar auth-form">
        <button
          type="button"
          className={activeTab === "post" ? "active" : ""}
          onClick={() => setActiveTab("post")}
        >
          Post 
        </button>
        <button
          type="button"
          className={activeTab === "findJobs" ? "active" : ""}
          onClick={() => setActiveTab("findJobs")}
        >
          Find Jobs
        </button>
        <button
          type="button"
          className={activeTab === "saved" ? "active" : ""}
          onClick={() => setActiveTab("saved")}
        >
          Saved 
        </button>
        <button
          type="button"
          className={activeTab === "messages" ? "active" : ""}
          onClick={() => setActiveTab("messages")}
        >
          Messages
        </button>
        <button
          type="button"
          className={activeTab === "myPosts" ? "active" : ""}
          onClick={() => setActiveTab("myPosts")}
        >
          My Posts
        </button>
      </div>

      <div
        className={`jobs-shell auth-layout ${activeTab === "post" ? "jobs-shell-post" : ""}`}
        style={{ maxWidth: activeTab === "post" ? 760 : 1200 }}
      >
        {activeTab === "post" && (
          <div className="auth-form jobs-panel jobs-post-only">
            <div className="profile-header-row">
              <div>
                <p className="eyebrow">Hiring</p>
                <h2>Post a job</h2>
              </div>
              <span className="profile-status">
                {posting ? "Posting..." : "Open"}
              </span>
            </div>

            <form className="jobs-form" onSubmit={handlePost}>
              <div className="profile-form-grid">
                <div>
                  <label>Job title</label>
                  <input
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="jobs-input"
                    required
                  />
                </div>

                <div>
                  <label>Company</label>
                  <input
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className="jobs-input"
                    required
                  />
                </div>

                <div className="full-width">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="jobs-textarea"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label>Salary</label>
                  <input
                    value={form.salary}
                    onChange={(e) => updateField("salary", e.target.value)}
                    className="jobs-input"
                    placeholder="$90,000/year"
                    required
                  />
                </div>

                <div>
                  <label>Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="jobs-input"
                    required
                  />
                </div>

                <div>
                  <label>Work type</label>
                  <select
                    value={form.workType}
                    onChange={(e) => updateField("workType", e.target.value)}
                    className="jobs-input"
                    required
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label>Payment frequency</label>
                  <select
                    value={form.paymentFrequency}
                    onChange={(e) =>
                      updateField("paymentFrequency", e.target.value)
                    }
                    className="jobs-input"
                    required
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Per project">Per project</option>
                  </select>
                </div>

                <div className="full-width">
                  <label>Requirements</label>
                  <textarea
                    value={form.requirements}
                    onChange={(e) =>
                      updateField("requirements", e.target.value)
                    }
                    className="jobs-textarea"
                    rows={4}
                    placeholder="List the must-have requirements for the role"
                    required
                  />
                </div>
              </div>

              <button
                className="btn-submit jobs-post-btn"
                type="submit"
                disabled={posting}
              >
                {posting ? "Posting..." : "Post job"}
              </button>
            </form>
          </div>
        )}

        {activeTab !== "post" && (
          <main className="auth-form jobs-summary jobs-summary-wide">
            <div className="profile-header-row">
              <div>
                <p className="eyebrow">Marketplace</p>
                <h2>Open positions</h2>
              </div>
              <div className="jobs-mini-stat">{jobs.length} roles</div>
            </div>

            <div className="jobs-search-wrap">
              <input
                placeholder="Search jobs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="jobs-search"
              />
            </div>

            {activeTab === "messages" && (
              <div className="jobs-message-panel">
                <div className="profile-header-row">
                  <div>
                    <p className="eyebrow">Live chat</p>
                    <h3>Job conversations</h3>
                  </div>
                </div>

                {jobs.length === 0 && (
                  <p className="text-muted">No conversations yet.</p>
                )}

                {jobs.slice(0, 5).map((job) => (
                  <button
                    key={job._id}
                    type="button"
                    className="jobs-message-item"
                    onClick={() => handleMessage(job)}
                  >
                    <span>{job.title}</span>
                    <span className="jobs-message-status">Open live chat</span>
                  </button>
                ))}
              </div>
            )}

            <div className="jobs-list">
              {loading && <p className="text-muted">Loading jobs...</p>}
              {!loading && tabJobs.length === 0 && (
                <p className="text-muted">
                  {activeTab === "saved"
                    ? "No saved jobs yet."
                    : activeTab === "myPosts"
                      ? "You have not posted any jobs yet."
                      : "No job posts yet."}
                </p>
              )}

              {highlightedJob && activeTab !== "saved" && (
                <article className="job-card job-featured-card">
                  <div className="job-card-main">
                    <div className="job-featured-brand">
                      <span className="job-badge">Just posted</span>
                      <h3 className="job-card-title">{highlightedJob.title}</h3>
                      <div className="small text-muted">
                        {highlightedJob.company} • {highlightedJob.location}
                      </div>
                    </div>
                    <div className="job-actions">
                      {canMessageJob(highlightedJob) && (
                        <button
                          className="job-message"
                          onClick={() => handleMessage(highlightedJob)}
                        >
                          Message
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="job-meta">
                    <span>{highlightedJob.salary}</span>
                    <span>{highlightedJob.workType}</span>
                    <span>{highlightedJob.paymentFrequency}</span>
                  </div>

                  <p className="job-desc">{highlightedJob.description}</p>

                  <div className="job-section">
                    <strong>Requirements:</strong>
                    <p>{highlightedJob.requirements}</p>
                  </div>
                </article>
              )}

              {tabJobs.map((job) => (
                <article key={job._id} className="job-card">
                  <div className="job-card-main">
                    <div>
                      <h3 className="job-card-title">{job.title}</h3>
                      <div className="small text-muted">
                        {job.company} • {job.location}
                      </div>
                    </div>
                    <div className="job-actions">
                      <button
                        type="button"
                        className={`job-save ${savedIds.has(job._id) ? "saved" : ""}`}
                        onClick={() => toggleSavedJob(job)}
                      >
                        {savedIds.has(job._id) ? "Saved" : "Save"}
                      </button>
                      {canMessageJob(job) && (
                        <button
                          className="job-message"
                          onClick={() => handleMessage(job)}
                        >
                          Message
                        </button>
                      )}
                      {canDeleteJob(job) && (
                        <button
                          onClick={() => handleRemove(job._id)}
                          className="job-remove"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="job-meta">
                    <span>{job.salary}</span>
                    <span>{job.workType}</span>
                    <span>{job.paymentFrequency}</span>
                  </div>

                  <p className="job-desc">{job.description}</p>

                  <div className="job-section">
                    <strong>Requirements:</strong>
                    <p>{job.requirements}</p>
                  </div>

                  <div className="job-poster">
                    <div className="poster-avatar">
                      {job.poster?.avatar ? (
                        <img
                          src={job.poster.avatar}
                          alt={job.poster.fullName || "Poster"}
                        />
                      ) : (
                        <span>
                          {(job.poster?.fullName || "P")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <strong>Person who posted it:</strong>
                      <p>
                        {job.poster?.fullName || "Employer"}
                        {job.poster?.username
                          ? ` (@${job.poster.username})`
                          : ""}
                      </p>
                      {job.poster?._id && (
                        <button
                          type="button"
                          className="job-message"
                          style={{ marginTop: "0.4rem" }}
                          onClick={() =>
                            navigate(`/profile?userId=${job.poster._id}`)
                          }
                        >
                          View profile
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
