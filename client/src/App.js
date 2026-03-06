import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      height: "100vh", background: "#0b141a",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#25D366", fontSize: 32,
    }}>💬</div>
  );
  return user ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
