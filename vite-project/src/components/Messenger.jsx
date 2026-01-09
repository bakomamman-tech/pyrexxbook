import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API_BASE from "../utils/api";
import "./Messenger.css";

const socket = io(API_BASE.replace("/api", ""), {
  transports: ["websocket"],
});

export default function Messenger({ user, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [users, setUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]); // 👈 NEW
  const bottomRef = useRef();

  // Join socket as this user
  useEffect(() => {
    socket.emit("join", user._id);

    socket.on("onlineUsers", users => {
      setOnlineUsers(users);
    });

    return () => socket.off("onlineUsers");
  }, [user]);

  // Load all users
  useEffect(() => {
    fetch(`${API_BASE}/api/users`)
      .then(r => r.json())
      .then(list => {
        const map = {};
        list.forEach(u => (map[u._id] = u));
        setUsers(map);
      });
  }, []);

  // Load conversations
  useEffect(() => {
    fetch(`${API_BASE}/api/conversations/${user._id}`)
      .then(r => r.json())
      .then(setConversations);
  }, [user]);

  // Load messages when a chat opens
  useEffect(() => {
    if (!active) return;

    fetch(`${API_BASE}/api/messages/${active._id}`)
      .then(r => r.json())
      .then(setMessages);
  }, [active]);

  // Receive real-time messages
  useEffect(() => {
    socket.on("newMessage", msg => {
      if (msg.conversationId === active?._id) {
        setMessages(prev => [...prev, msg]);
      }

      setConversations(prev =>
        prev.map(c =>
          c._id === msg.conversationId
            ? { ...c, lastMessage: msg.text }
            : c
        )
      );
    });

    return () => socket.off("newMessage");
  }, [active]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim() || !active) return;

    const receiverId = active.members.find(m => m !== user._id);

    socket.emit("sendMessage", {
      conversationId: active._id,
      senderId: user._id,
      receiverId,
      text,
    });

    setText("");
  };

  const getFriend = convo => {
    const id = convo.members.find(m => m !== user._id);
    return users[id];
  };

  const isOnline = (id) => onlineUsers.includes(id); // 👈 NEW

  return (
    <div className="messenger-popup">
      <div className="messenger-header">
        <span>Messenger</span>
        <button onClick={onClose}>✖</button>
      </div>

      <div className="messenger-body">
        {/* LEFT */}
        <div className="messenger-left">
          {conversations.map(c => {
            const friend = getFriend(c);
            return (
              <div
                key={c._id}
                className={`convo ${active?._id === c._id ? "active" : ""}`}
                onClick={() => setActive(c)}
              >
                <div className="avatar-wrap">
                  <img
                    src={
                      friend?.avatar
                        ? `${API_BASE}${friend.avatar}`
                        : "https://ui-avatars.com/api/?name=User"
                    }
                    className="convo-avatar"
                  />
                  {isOnline(friend?._id) && <span className="online-dot"></span>}
                </div>

                <div>
                  <strong>{friend?.name || "User"}</strong>
                  <div className="last-msg">
                    {c.lastMessage || "Start chatting"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT */}
        <div className="messenger-right">
          {active ? (
            <>
              <div className="chat-header">
                <strong>{getFriend(active)?.name || "Chat"}</strong>
                {isOnline(getFriend(active)?._id) && (
                  <span className="chat-online">Online</span>
                )}
              </div>

              <div className="messages">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`bubble ${
                      m.senderId === user._id ? "me" : "them"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="send-box">
                <input
                  placeholder="Type a message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                />
                <button onClick={send}>Send</button>
              </div>
            </>
          ) : (
            <p style={{ padding: 20 }}>Select a chat</p>
          )}
        </div>
      </div>
    </div>
  );
}
