import { useEffect, useState } from "react";
import API_BASE from "../utils/api";
import "./Messenger.css";

export default function Messenger({ user, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/conversations/${user._id}`)
      .then(res => res.json())
      .then(setConversations);
  }, []);

  useEffect(() => {
    if (!active) return;
    fetch(`${API_BASE}/api/messages/${active._id}`)
      .then(res => res.json())
      .then(setMessages);
  }, [active]);

  const send = async () => {
    if (!text.trim()) return;

    const res = await fetch(`${API_BASE}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: active._id,
        senderId: user._id,
        text
      })
    });

    const msg = await res.json();
    setMessages([...messages, msg]);
    setText("");
  };

  return (
    <div className="messenger-popup">
      <div className="messenger-header">
        <span>Messenger</span>
        <button onClick={onClose}>✖</button>
      </div>

      <div className="messenger-body">
        <div className="messenger-left">
          {conversations.map(c => (
            <div
              key={c._id}
              className={`convo ${active?._id === c._id ? "active" : ""}`}
              onClick={() => setActive(c)}
            >
              <div>{c.lastMessage || "New chat"}</div>
            </div>
          ))}
        </div>

        <div className="messenger-right">
          {active ? (
            <>
              <div className="messages">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={m.senderId === user._id ? "me" : "them"}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <div className="send-box">
                <input
                  placeholder="Type a message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
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
