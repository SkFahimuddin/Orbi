// Generate consistent room ID from two user IDs
export const getRoomId = (id1, id2) => [id1, id2].sort().join("_");

// Format time for messages
export const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Format last seen
export const formatLastSeen = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return date.toLocaleDateString();
};

// Get initials from username
export const getInitials = (username = "") =>
  username.slice(0, 2).toUpperCase();
