import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import "../css/Chat.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function readConversations() {
  try {
    const saved = localStorage.getItem("jobconnect-chat-history");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const recipientId = searchParams.get("recipientId");
  const currentUserId = localStorage.getItem("userId") || "guest";
  const initialName = searchParams.get("displayName") || "this person";
  const [recipientName, setRecipientName] = useState(initialName);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [people, setPeople] = useState([]);
  const socketRef = useRef(null);
  const listRef = useRef(null);

  function saveConversation(partnerId, partnerName, previewText) {
    if (!partnerId) return;

    setConversations((prev) => {
      const next = [
        {
          id: partnerId,
          name: partnerName || "User",
          lastMessage: previewText || "New message",
          updatedAt: Date.now(),
        },
        ...prev.filter((item) => item.id !== partnerId),
      ].slice(0, 20);

      localStorage.setItem("jobconnect-chat-history", JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    setConversations(readConversations());
  }, []);

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/users?excludeId=${encodeURIComponent(currentUserId)}`,
        );
        if (!res.ok) return;
        setPeople(await res.json());
      } catch (err) {
        console.error("Failed to load chat contacts", err);
      }
    };

    if (currentUserId !== "guest") loadPeople();
  }, [currentUserId]);

  function openConversation(id, name) {
    if (!id || id === currentUserId) return;
    navigate(
      `/chat?recipientId=${id}&displayName=${encodeURIComponent(name || "User")}`,
    );
  }

  useEffect(() => {
    if (!recipientId || recipientId === currentUserId) {
      navigate("/chat");
      return;
    }

    const loadRecipient = async () => {
      // Basic ID validation
      if (!recipientId || recipientId.length !== 24) {
        setRecipientName("Unknown User");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/users/${recipientId}`);
        if (!res.ok) throw new Error("User not found");
        const user = await res.json();
        const name = user.fullName || user.username || "User";
        setRecipientName(name);
        saveConversation(recipientId, name, "Start a conversation");
      } catch (err) {
        console.warn("Failed to load recipient profile:", err);
        setRecipientName(initialName || "User");
        saveConversation(recipientId, initialName || "User", "Conversation");
      }
    };

    loadRecipient();
  }, [recipientId, currentUserId, navigate, initialName]);

  useEffect(() => {
    // Clear messages when switching recipient to prevent "bleed"
    setMessages([]);

    if (!recipientId || recipientId === currentUserId) return;

    const roomId = [currentUserId, recipientId].sort().join("_");
    const socket = io(API_BASE, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("Socket connected, joining room:", roomId);
      socket.emit("join_room", { roomId, userId: currentUserId });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    socket.on("chat_history", (history = []) => {
      setMessages(history);
      if (history.length > 0) {
        const last = history[history.length - 1];
        const partnerName =
          last.senderId === currentUserId
            ? recipientName
            : last.senderName || recipientName;
        saveConversation(recipientId, partnerName, last.text);
      }
    });

    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);

      if (message.senderId === currentUserId) {
        saveConversation(recipientId, recipientName, message.text);
      } else {
        saveConversation(
          message.senderId,
          message.senderName || recipientName,
          message.text,
        );
      }
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [recipientId, currentUserId, recipientName]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !recipientId || !socketRef.current) return;

    if (recipientId === currentUserId) {
      navigate("/chat");
      return;
    }

    const roomId = [currentUserId, recipientId].sort().join("_");
    const payload = {
      roomId,
      senderId: currentUserId,
      senderName: "You",
      text: text.trim(),
    };

    socketRef.current.emit("send_message", payload);
    saveConversation(recipientId, recipientName, text.trim());
    setText("");
  }

  if (!recipientId) {
    return (
      <div className="chat-page form-page">
        <div className="chat-shell auth-layout" style={{ maxWidth: 720 }}>
          <div className="auth-form chat-empty-state">
            <p className="eyebrow">Direct messages</p>
            <h2>Recent conversations</h2>

            {conversations.length === 0 ? (
              <p className="text-muted">Choose someone below to start a conversation.</p>
            ) : (
              <div className="chat-history-list">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className="chat-history-item"
                    onClick={() => openConversation(conversation.id, conversation.name)}
                  >
                    <div>
                      <strong>{conversation.name}</strong>
                      <small>{conversation.lastMessage}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="chat-people-section">
              <p className="chat-list-label">People</p>
              {people.length === 0 ? (
                <p className="text-muted">No other users are available yet.</p>
              ) : (
                <div className="chat-history-list">
                  {people.map((person) => {
                    const name = person.fullName || person.username || "User";
                    return (
                      <button
                        key={person._id}
                        type="button"
                        className="chat-history-item chat-person-item"
                        onClick={() => openConversation(person._id, name)}
                      >
                        <strong>{name}</strong>
                        <small>Start a direct conversation</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page form-page">
      <div className="chat-shell auth-layout" style={{ maxWidth: 900 }}>
        <aside className="chat-conversation-sidebar">
          <div className="chat-sidebar-heading">
            <p className="eyebrow">Messages</p>
            <h2>Conversations</h2>
          </div>
          {conversations.length === 0 ? (
            <p className="chat-sidebar-empty">Your recent conversations will appear here.</p>
          ) : (
            <div className="chat-history-list">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={`chat-history-item ${conversation.id === recipientId ? "active" : ""}`}
                  onClick={() =>
                    openConversation(conversation.id, conversation.name)
                  }
                >
                  <div>
                    <strong>{conversation.name}</strong>
                    <small>{conversation.lastMessage}</small>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="chat-people-section">
            <p className="chat-list-label">People</p>
            {people
              .filter((person) => !conversations.some((item) => item.id === person._id))
              .map((person) => {
                const name = person.fullName || person.username || "User";
                return (
                  <button
                    key={person._id}
                    type="button"
                    className="chat-history-item chat-person-item"
                    onClick={() => openConversation(person._id, name)}
                  >
                    <strong>{name}</strong>
                    <small>Start a direct conversation</small>
                  </button>
                );
              })}
          </div>
        </aside>
        <div className="auth-form chat-panel">
          <div className="chat-header">
            <button
              type="button"
              className="chat-back-btn"
              onClick={() => navigate("/chat")}
            >
              ← Back
            </button>
            <div>
              <p className="eyebrow">Direct message</p>
              <h2>{recipientName}</h2>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <button
                type="button"
                className="chat-back-btn"
                onClick={() =>
                  navigate(
                    `/profile?userId=${recipientId}&returnToChat=1&displayName=${encodeURIComponent(recipientName)}`,
                  )
                }
              >
                View profile
              </button>
            </div>
          </div>

          <div ref={listRef} className="chat-thread">
            {messages.length === 0 ? (
              <div className="chat-empty-msg">
                <p className="text-muted">
                  No messages yet. Introduce yourself and ask about the role.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = message.senderId === currentUserId;
                return (
                  <div
                    key={message._id || message.id || `${message.createdAt}-${message.text}`}
                    className={`chat-message-row ${isMine ? "mine" : "theirs"}`}
                  >
                    <div className="chat-bubble">
                      <div className="chat-bubble-text">{message.text}</div>
                      <div className="chat-meta">
                        {message.senderName || "User"}{" "}
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}


          <form className="chat-form" onSubmit={sendMessage}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type your message..."
            />
            <button className="btn-submit" type="submit" disabled={!connected}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

