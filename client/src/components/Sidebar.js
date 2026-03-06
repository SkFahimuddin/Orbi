import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getInitials, formatTime, formatLastSeen } from "../utils/helpers";

function Avatar({ user, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: user.avatarColor || "#25D366",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: size * 0.36,
      flexShrink: 0, letterSpacing: 0.5,
    }}>
      {getInitials(user.username)}
    </div>
  );
}

export default function Sidebar({ activeChat, onSelectChat }) {
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await axios.get("/api/messages/conversations/list");
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations");
    }
  };

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/users?search=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {}
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = (contactUser) => {
    setSearchQuery("");
    onSelectChat(contactUser);
  };

  const getOtherUser = (conv) => {
    const msg = conv.lastMessage;
    if (!msg.sender || !msg.receiver) return null;
    const senderId = msg.sender._id || msg.sender;
    return senderId.toString() === user._id.toString() ? msg.receiver : msg.sender;
  };

  return (
    <div style={{
      width: 380, minWidth: 320, display: "flex", flexDirection: "column",
      background: "#111c21", borderRight: "1px solid #1f2c33", height: "100vh",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", background: "#1f2c33",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #0b141a",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar user={user} size={40} />
          <div>
            <div style={{ color: "#e9edef", fontWeight: 600, fontSize: 15 }}>{user.username}</div>
            <div style={{ color: "#25D366", fontSize: 11 }}>● Online</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Logout"
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "#8696a0", fontSize: 20, padding: "6px 10px", borderRadius: 8,
          }}
        >⏻</button>
      </div>

      {/* Search */}
      <div style={{ padding: "8px 12px", background: "#111c21" }}>
        <div style={{
          background: "#1f2c33", borderRadius: 8, padding: "8px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ color: "#8696a0" }}>🔍</span>
          <input
            placeholder="Search users to start chatting..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: "transparent", border: "none", color: "#e9edef",
              fontSize: 14, width: "100%", fontFamily: "'Outfit', sans-serif", outline: "none",
            }}
          />
          {searchQuery && (
            <span style={{ cursor: "pointer", color: "#8696a0" }} onClick={() => setSearchQuery("")}>✕</span>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {searchQuery ? (
          <>
            <div style={{ padding: "8px 16px", color: "#8696a0", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
              {searching ? "Searching..." : `Results (${searchResults.length})`}
            </div>
            {searchResults.map(u => (
              <ContactRow
                key={u._id}
                user={u}
                isOnline={onlineUsers.includes(u._id)}
                subtitle={u.about || ""}
                isActive={activeChat?._id === u._id}
                onClick={() => handleSelectUser(u)}
              />
            ))}
            {!searching && searchResults.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#8696a0", fontSize: 14 }}>
                No users found for "{searchQuery}"
              </div>
            )}
          </>
        ) : (
          <>
            {conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#8696a0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>No conversations yet</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Search for a user above to start chatting</div>
              </div>
            ) : (
              conversations.map(conv => {
                const other = getOtherUser(conv);
                if (!other) return null;
                return (
                  <ContactRow
                    key={conv._id}
                    user={other}
                    isOnline={onlineUsers.includes(other._id)}
                    subtitle={conv.lastMessage.text}
                    time={formatTime(conv.lastMessage.createdAt)}
                    unread={conv.unreadCount}
                    isActive={activeChat?._id === other._id}
                    onClick={() => handleSelectUser(other)}
                  />
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ContactRow({ user, isOnline, subtitle, time, unread, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 14,
        cursor: "pointer", borderBottom: "1px solid #1a2930",
        background: isActive ? "#1a2930" : "transparent",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#1a2930"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: user.avatarColor || "#25D366",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: 17,
        }}>
          {getInitials(user.username)}
        </div>
        {isOnline && (
          <div style={{
            width: 12, height: 12, borderRadius: "50%", background: "#25D366",
            border: "2px solid #111c21", position: "absolute", bottom: 1, right: 1,
          }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#e9edef", fontWeight: 600, fontSize: 15 }}>{user.username}</span>
          {time && <span style={{ color: unread > 0 ? "#25D366" : "#8696a0", fontSize: 11 }}>{time}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
          <span style={{
            color: "#8696a0", fontSize: 13, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220,
          }}>
            {subtitle}
          </span>
          {unread > 0 && (
            <span style={{
              background: "#25D366", color: "#111c21", borderRadius: "50%",
              width: 20, height: 20, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}