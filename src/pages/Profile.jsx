import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/Profile.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewedUserId = searchParams.get("userId");
  const returnToChat = searchParams.get("returnToChat") === "1";
  const storedId = localStorage.getItem("userId");
  const currentUserId = storedId || null;
  const isOwnProfile = !viewedUserId || viewedUserId === currentUserId;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setHasUnsavedChanges(true);
    if (status.type === "error") setStatus({ type: "", message: "" });
  }

  function handleAvatarUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file || !profile || !isOwnProfile) return;

    // Limit file size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: "error", message: "Image size must be less than 2MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if larger than 500x500
        if (width > 500 || height > 500) {
          const ratio = Math.min(500 / width, 500 / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG data URL
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        updateProfile("avatar", compressedDataUrl);
        setStatus({ type: "", message: "" });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    const idToFetch = viewedUserId || currentUserId;
    if (!idToFetch) return;
    fetchProfile(idToFetch);
  }, [viewedUserId, currentUserId]);

  async function fetchProfile(id) {
    if (!id) return;
    setLoading(true);
    try {
      const viewerId = currentUserId || viewedUserId || "";
      const res = await fetch(
        `${API_BASE}/api/users/${id}?viewerId=${encodeURIComponent(viewerId)}`,
      );
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile(data);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!profile || !profile._id || !isOwnProfile) return;
    // simple client-side validation
    if (!profile.fullName || !profile.fullName.trim()) {
      setStatus({ type: "error", message: "Full name is required." });
      return;
    }
    setSaving(true);
    setStatus({ type: "", message: "" });
    try {
      const payload = {
        fullName: profile.fullName,
        username: profile.username,
        avatar: profile.avatar,
        location: profile.location,
        bio: profile.bio,
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        experience: profile.experience,
        contactInfo: profile.contactInfo,
      };

      const res = await fetch(`${API_BASE}/api/users/${profile._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      // reload profile from server to ensure saved state
      setProfile(data);
      localStorage.setItem("userId", data._id);
      setHasUnsavedChanges(false);
      setStatus({ type: "", message: "" });
      // re-fetch to ensure any server-side changes are reflected
      fetchProfile(data._id);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Save failed" });
      setHasUnsavedChanges(true);
    } finally {
      setSaving(false);
    }
  }

  const displayName = profile?.fullName || profile?.username || "Profile";

  if (!currentUserId && !viewedUserId) {
    return (
      <div className="form-page">
        <div className="auth-layout">
          <div className="auth-form profile-empty">
            <h2>Profile</h2>
            <p className="text-muted">
              You must be logged in to view or edit your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page form-page">
      <div className="profile-shell auth-layout" style={{ maxWidth: 1000 }}>
        <form className="auth-form profile-form" onSubmit={handleSave}>
          {status.message && (
            <div
              className={`msg-box ${status.type === "success" ? "msg-success" : "msg-error"}`}
            >
              {status.message}
            </div>
          )}
          <div className="profile-header-row">
            <div>
              <p className="eyebrow">
                {isOwnProfile ? "Profile" : "Public profile"}
              </p>
              <h2>{isOwnProfile ? "Your profile" : displayName}</h2>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              {returnToChat && !isOwnProfile && (
                <button
                  type="button"
                  className="chat-back-btn"
                  onClick={() =>
                    navigate(
                      `/chat?recipientId=${viewedUserId}&displayName=${encodeURIComponent(displayName)}`,
                    )
                  }
                >
                  ← Back
                </button>
              )}
              <span className="profile-status">
                {loading
                  ? "Loading..."
                  : isOwnProfile
                    ? "Ready"
                    : "Public view"}
              </span>
            </div>
          </div>

          <div className="profile-avatar-upload-wrap">
            <div className="profile-card-avatar">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile avatar" />
              ) : (
                <span>
                  {(profile?.fullName || profile?.username || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>

            {isOwnProfile && (
              <label className="avatar-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                Upload photo
              </label>
            )}
          </div>

          <div className="profile-form-grid">
            <div>
              <label>Full name</label>
              <input
                value={profile?.fullName || ""}
                readOnly={!isOwnProfile}
                onChange={(e) =>
                  isOwnProfile && updateProfile("fullName", e.target.value)
                }
              />
            </div>

            <div>
              <label>Username</label>
              <input
                value={profile?.username || ""}
                readOnly={!isOwnProfile}
                onChange={(e) =>
                  isOwnProfile && updateProfile("username", e.target.value)
                }
              />
            </div>

            <div>
              <label>Location</label>
              <input
                value={profile?.location || ""}
                readOnly={!isOwnProfile}
                onChange={(e) =>
                  isOwnProfile && updateProfile("location", e.target.value)
                }
              />
            </div>

            {!isOwnProfile && (
              <div>
                <label>Public contact</label>
                <input
                  value={
                    profile?.contactInfo
                      ? "Contact details are private"
                      : "No public contact info"
                  }
                  readOnly
                />
              </div>
            )}

            {isOwnProfile && (
              <div>
                <label>Contact info</label>
                <input
                  value={profile?.contactInfo || ""}
                  onChange={(e) => updateProfile("contactInfo", e.target.value)}
                />
              </div>
            )}

            <div className="full-width">
              <label>Bio</label>
              <textarea
                rows={3}
                value={profile?.bio || ""}
                readOnly={!isOwnProfile}
                onChange={(e) =>
                  isOwnProfile && updateProfile("bio", e.target.value)
                }
              />
            </div>

            <div className="full-width">
              <label>Skills</label>
              <input
                value={(profile?.skills || []).join(", ")}
                readOnly={!isOwnProfile}
                onChange={(e) =>
                  isOwnProfile &&
                  updateProfile(
                    "skills",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>

            <div className="full-width">
              <label>Experience</label>
              <textarea
                rows={3}
                value={profile?.experience || ""}
                readOnly={!isOwnProfile}
                onChange={(e) =>
                  isOwnProfile && updateProfile("experience", e.target.value)
                }
              />
            </div>
          </div>

          {isOwnProfile && (
            <button className="btn-submit" type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : hasUnsavedChanges
                  ? "Save Changes"
                  : "Saved ✓"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
