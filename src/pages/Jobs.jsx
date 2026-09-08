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
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedJob, setHighlightedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

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
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setJobs((s) => s.filter((j) => j._id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleMessage(job) {
    if (!localStorage.getItem("userId")) {
      navigate("/login");
      return;
    }

    const posterId = job.poster?._id || job.poster;
    if (!posterId) return;

    navigate(
      `/chat?recipientId=${posterId}&jobId=${job._id}&jobTitle=${encodeURIComponent(job.title)}`,
    );
  }

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

  return (
    <div className="jobs-page form-page">
      <div className="jobs-shell auth-layout" style={{ maxWidth: 1200 }}>
        <aside className="auth-form jobs-panel">
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
                  onChange={(e) => updateField("requirements", e.target.value)}
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
        </aside>

        <main className="auth-form jobs-summary">
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

          <div className="jobs-list">
            {loading && <p className="text-muted">Loading jobs...</p>}
            {!loading && filtered.length === 0 && (
              <p className="text-muted">No job posts yet.</p>
            )}

            {highlightedJob && (
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
                    <button
                      className="job-message"
                      onClick={() => handleMessage(highlightedJob)}
                    >
                      Message
                    </button>
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

            {filtered.map((job) => (
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
                      className="job-message"
                      onClick={() => handleMessage(job)}
                    >
                      Message
                    </button>
                    <button
                      onClick={() => handleRemove(job._id)}
                      className="job-remove"
                    >
                      Remove
                    </button>
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
                        {(job.poster?.fullName || "P").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <strong>Person who posted it:</strong>
                    <p>
                      {job.poster?.fullName || "Employer"}
                      {job.poster?.username ? ` (@${job.poster.username})` : ""}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
