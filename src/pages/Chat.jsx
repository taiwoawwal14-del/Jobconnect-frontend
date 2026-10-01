import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import "../css/Chat.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function buildRoomId(a, b) {
  return [a, b].filter(Boolean).sort().join("_");
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

  function resetChatState() {
    setConversations([]);
    setMessages([]);
    setText("");
    navigate("/chat");
  }

  function saveConversation(partnerId, partnerName, previewText) {
    if (!partnerId || partnerId === currentUserId) return;

    setConversations((prev) => {
      const next = [
        {
          id: partnerId,
          name: partnerName || "User",
          lastMessage: previewText || "New message",
          updatedAt: Date.now(),
        },
        ...prev.filter((item) => item.id !== partnerId),
      ]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 20);

      return next;
    });
  }

  useEffect(() => {
    setConversations([]);
  }, [currentUserId]);

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
    setMessages([]);

    if (!recipientId || recipientId === currentUserId) return;

    const roomId = buildRoomId(currentUserId, recipientId);
    const socket = io(API_BASE, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_room", { roomId, userId: currentUserId });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      toast.error("Chat connection failed. Try again.");
    });

    socket.on("chat_history", (history = []) => {
      const roomMessages = history.filter(
        (message) => message.roomId === roomId,
      );
      setMessages(roomMessages);

      if (roomMessages.length > 0) {
        const last = roomMessages[roomMessages.length - 1];
        saveConversation(
          recipientId,
          recipientName || initialName || "User",
          last.text,
        );
      }
    });

    socket.on("receive_message", (message) => {
      if (message.roomId !== roomId) return;

      setMessages((prev) => [...prev, message]);
      saveConversation(
        message.senderId === currentUserId ? recipientId : message.senderId,
        message.senderId === currentUserId
          ? recipientName || initialName || "User"
          : message.senderName || recipientName || "User",
        message.text,
      );
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [recipientId, currentUserId, recipientName, initialName]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    const trimmedText = text.trim();

    if (!trimmedText || !recipientId || !socketRef.current) return;

    if (recipientId === currentUserId) {
      navigate("/chat");
      return;
    }

    const roomId = buildRoomId(currentUserId, recipientId);
    const payload = {
      roomId,
      senderId: currentUserId,
      senderName: "You",
      recipientId,
      text: trimmedText,
    };

    socketRef.current.emit("send_message", payload);
    saveConversation(
      recipientId,
      recipientName || initialName || "User",
      trimmedText,
    );
    setText("");
  }

  if (!recipientId) {
    return (
      <div className="chat-page form-page">
        <div className="chat-shell auth-layout" style={{ maxWidth: 720 }}>
          <div className="auth-form chat-empty-state">
            <div className="chat-header" style={{ marginBottom: "1rem" }}>
              <div>
                <p className="eyebrow">Direct messages</p>
                <h2>Recent conversations</h2>
              </div>
              <button
                type="button"
                className="chat-back-btn"
                onClick={resetChatState}
              >
                Clear chat
              </button>
            </div>

            {conversations.length === 0 ? (
              <p className="text-muted">
                Choose someone below to start a conversation.
              </p>
            ) : (
              <div className="chat-history-list">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className="chat-history-item"
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
            <p className="chat-sidebar-empty">
              Your recent conversations will appear here.
            </p>
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
              .filter(
                (person) =>
                  !conversations.some((item) => item.id === person._id),
              )
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
              <button
                type="button"
                className="chat-back-btn"
                onClick={resetChatState}
              >
                Clear chat
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
                    key={
                      message._id ||
                      message.id ||
                      `${message.createdAt}-${message.text}`
                    }
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
