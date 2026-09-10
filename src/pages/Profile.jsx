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

  function handleAvatarUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file || !profile || !isOwnProfile) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfile({ ...profile, avatar: reader.result });
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!profile || !profile._id || !isOwnProfile) return;
    setSaving(true);
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
      setProfile(data);
      localStorage.setItem("userId", data._id);
    } catch (err) {
      console.error(err);
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
                  isOwnProfile &&
                  setProfile({ ...profile, fullName: e.target.value })
                }
              />
            </div>

            <div>
              <label>Username</label>
              <input
                value={profile?.username || ""}
                readOnly={!isOwnProfile}
                onChange={(e) =>
                  isOwnProfile &&
                  setProfile({ ...profile, username: e.target.value })
                }
              />
            </div>

            <div>
              <label>Location</label>
              <input
                value={profile?.location || ""}
                readOnly={!isOwnProfile}
                onChange={(e) =>
                  isOwnProfile &&
                  setProfile({ ...profile, location: e.target.value })
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
                  onChange={(e) =>
                    setProfile({ ...profile, contactInfo: e.target.value })
                  }
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
                  isOwnProfile &&
                  setProfile({ ...profile, bio: e.target.value })
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
                  setProfile({
                    ...profile,
                    skills: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
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
                  isOwnProfile &&
                  setProfile({ ...profile, experience: e.target.value })
                }
              />
            </div>
          </div>

          {isOwnProfile && (
            <button className="btn-submit" type="submit" disabled={saving}>
              {saving ? "Saving profile..." : "Save profile"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
