import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import "../css/Chat.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function Chat() {
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get("recipientId");
  const jobTitle = searchParams.get("jobTitle") || "this role";
  const currentUserId = localStorage.getItem("userId") || "guest";
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!recipientId) return;

    const roomId = [currentUserId, recipientId].sort().join("_");
    const socket = io(API_BASE, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_room", { roomId, userId: currentUserId });
    });

    socket.on("chat_history", (history = []) => {
      setMessages(history);
    });

    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [recipientId, currentUserId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !recipientId || !socketRef.current) return;

    const roomId = [currentUserId, recipientId].sort().join("_");
    const payload = {
      roomId,
      senderId: currentUserId,
      senderName: "You",
      text: text.trim(),
    };

    socketRef.current.emit("send_message", payload);
    setText("");
  }

  if (!recipientId) {
    return (
      <div className="chat-page form-page">
        <div className="chat-shell auth-layout" style={{ maxWidth: 720 }}>
          <div className="auth-form chat-empty-state">
            <p className="eyebrow">Direct message</p>
            <h2>Start a conversation</h2>
            <p className="text-muted">
              Choose a job and press “Message” to start a private chat about the
              role.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page form-page">
      <div className="chat-shell auth-layout" style={{ maxWidth: 900 }}>
        <div className="auth-form chat-panel">
          <div className="chat-header">
            <div>
              <p className="eyebrow">Job discussion</p>
              <h2>{jobTitle}</h2>
            </div>
            <span className={`chat-status ${connected ? "online" : "offline"}`}>
              {connected ? "Connected" : "Connecting..."}
            </span>
          </div>

          <div ref={listRef} className="chat-thread">
            {messages.length === 0 && (
              <div className="chat-empty-msg">
                <p className="text-muted">
                  No messages yet. Introduce yourself and ask about the role.
                </p>
              </div>
            )}

            {messages.map((message) => {
              const isMine = message.senderId === currentUserId;
              return (
                <div
                  key={message.id || `${message.createdAt}-${message.text}`}
                  className={`chat-message-row ${isMine ? "mine" : "theirs"}`}
                >
                  <div className="chat-bubble">
                    <div className="chat-bubble-text">{message.text}</div>
                    <div className="chat-meta">
                      {message.senderName || "User"} •{" "}
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form className="chat-form" onSubmit={sendMessage}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
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
