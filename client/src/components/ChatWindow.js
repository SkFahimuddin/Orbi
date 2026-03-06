import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getRoomId, formatTime, formatLastSeen, getInitials } from "../utils/helpers";

function TickIcon({ read }) {
  return read
    ? <span style={{ color: "#34B7F1", fontSize: 12 }}>✓✓</span>
    : <span style={{ color: "#8696a0", fontSize: 12 }}>✓✓</span>;
}

export default function ChatWindow({ contact, onNewMessage }) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const roomId = getRoomId(user._id, contact._id);

  // Load message history
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    axios.get(`/api/messages/${contact._id}`)
      .then(res => setMessages(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [contact._id]);

  // Join socket room and listen for messages
  useEffect(() => {
    if (!socket) return;

    socket.emit("join_room", roomId);
    socket.emit("mark_read", { roomId, userId: user._id });

    const onReceive = (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender._id !== user._id) {
        socket.emit("mark_read", { roomId, userId: user._id });
      }
      onNewMessage?.();
    };

    const onTyping = ({ userId, username }) => {
      if (userId !== user._id) setTypingUser(username);
    };

    const onStopTyping = () => setTypingUser(null);

    const onRead = ({ roomId: rId }) => {
      if (rId === roomId) {
        setMessages(prev => prev.map(m =>
          m.sender._id === user._id ? { ...m, read: true } : m
        ));
      }
    };

    socket.on("receive_message", onReceive);
    socket.on("user_typing", onTyping);
    socket.on("user_stopped_typing", onStopTyping);
    socket.on("messages_read", onRead);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("user_typing", onTyping);
      socket.off("user_stopped_typing", onStopTyping);
      socket.off("messages_read", onRead);
    };
  }, [socket, roomId, user._id, onNewMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket) return;
    socket.emit("typing_start", { roomId, userId: user._id, username: user.username });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing_stop", { roomId, userId: user._id });
    }, 1500);
  };

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || !socket) return;

    socket.emit("send_message", {
      senderId: user._id,
      receiverId: contact._id,
      text,
      roomId,
    });

    socket.emit("typing_stop", { roomId, userId: user._id });
    setInputText("");
  }, [inputText, socket, user._id, contact._id, roomId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isOnline = onlineUsers.includes(contact._id);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", background: "#0b141a" }}>
      {/* Header */}
      <div style={{
        padding: "10px 20px", background: "#1f2c33",
        display: "flex", alignItems: "center", gap: 14,
        borderBottom: "1px solid #1a2930", flexShrink: 0,
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: contact.avatarColor || "#25D366",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 16,
          }}>
            {getInitials(contact.username)}
          </div>
          {isOnline && (
            <div style={{
              width: 12, height: 12, borderRadius: "50%", background: "#25D366",
              border: "2px solid #1f2c33", position: "absolute", bottom: 1, right: 1,
            }} />
          )}
        </div>
        <div>
          <div style={{ color: "#e9edef", fontWeight: 600, fontSize: 16 }}>{contact.username}</div>
          <div style={{ fontSize: 12, color: typingUser ? "#25D366" : "#8696a0" }}>
            {typingUser ? "typing..." : isOnline ? "online" : `last seen ${formatLastSeen(contact.lastSeen)}`}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 20px",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#8696a0", paddingTop: 60 }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
            <div style={{ color: "#8696a0", fontSize: 15 }}>Say hi to <strong style={{ color: "#e9edef" }}>{contact.username}</strong></div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = (msg.sender._id || msg.sender) === user._id;
            const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();

            return (
              <div key={msg._id}>
                {showDate && (
                  <div style={{ textAlign: "center", margin: "12px 0" }}>
                    <span style={{
                      background: "#1f2c33", color: "#8696a0",
                      padding: "4px 14px", borderRadius: 20, fontSize: 12,
                    }}>
                      {new Date(msg.createdAt).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
                <div style={{
                  display: "flex", justifyContent: isMe ? "flex-end" : "flex-start",
                  marginBottom: 4,
                  animation: "fadeIn 0.2s ease",
                }}>
                  <div style={{
                    maxWidth: "65%", padding: "8px 12px",
                    borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    background: isMe ? "#025144" : "#1f2c33",
                    color: "#e9edef", fontSize: 14.5, lineHeight: 1.5,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.3)", wordBreak: "break-word",
                  }}>
                    <div>{msg.text}</div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: "#8696a0" }}>{formatTime(msg.createdAt)}</span>
                      {isMe && <TickIcon read={msg.read} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 4 }}>
            <div style={{
              padding: "10px 16px", borderRadius: "12px 12px 12px 2px",
              background: "#1f2c33", display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#8696a0",
                  animation: `bounce 1.2s ease infinite`,
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 16px", background: "#1f2c33",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <button style={{
          background: "transparent", border: "none", cursor: "pointer",
          width: 40, height: 40, borderRadius: "50%", fontSize: 22,
          display: "flex", alignItems: "center", justifyContent: "center", color: "#8696a0",
        }}>😊</button>

        <div style={{
          flex: 1, background: "#2a3942", borderRadius: 20,
          padding: "8px 16px", display: "flex", alignItems: "center",
        }}>
          <textarea
            placeholder={`Message ${contact.username}...`}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              background: "transparent", border: "none", color: "#e9edef",
              fontSize: 15, width: "100%", resize: "none",
              fontFamily: "'Outfit', sans-serif", lineHeight: 1.4,
              maxHeight: 100, overflow: "auto", outline: "none",
            }}
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={!inputText.trim()}
          style={{
            background: inputText.trim() ? "#25D366" : "#2a3942",
            border: "none", cursor: inputText.trim() ? "pointer" : "default",
            width: 44, height: 44, borderRadius: "50%", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", transition: "all 0.2s", flexShrink: 0,
          }}
        >➤</button>
      </div>
    </div>
  );
}
