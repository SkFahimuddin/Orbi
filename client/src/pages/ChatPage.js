import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function ChatPage() {
  const [activeContact, setActiveContact] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0b141a", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3b4a54; border-radius: 4px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
      `}</style>

      <Sidebar
        key={refreshKey}
        activeChat={activeContact}
        onSelectChat={setActiveContact}
      />

      {activeContact ? (
        <ChatWindow
          key={activeContact._id}
          contact={activeContact}
          onNewMessage={() => setRefreshKey(k => k + 1)}
        />
      ) : (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#0b141a", color: "#8696a0",
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", background: "#25D366",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, marginBottom: 24,
          }}>💬</div>
          <h2 style={{ color: "#e9edef", fontSize: 26, fontWeight: 300, marginBottom: 10 }}>
            ChatApp
          </h2>
          <p style={{ fontSize: 14, textAlign: "center", maxWidth: 360, lineHeight: 1.7 }}>
            Search for a friend by username and start chatting.<br />
            Messages are delivered in real-time ⚡
          </p>
          <div style={{
            marginTop: 28, padding: "10px 20px", background: "#1f2c33",
            borderRadius: 20, fontSize: 13,
          }}>
            🔒 Messages are private between you and your friend
          </div>
        </div>
      )}
    </div>
  );
}
