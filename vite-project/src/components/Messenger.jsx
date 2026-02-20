import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import API_BASE, { authFetch, avatarUrl } from "../utils/api";
import "./Messenger.css";

function sortByRecent(a, b) {
  return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Messenger({ user, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [people, setPeople] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const socket = useMemo(
    () =>
      io(API_BASE || window.location.origin, {
        transports: ["websocket"]
      }),
    []
  );

  const activeConversationRef = useRef("");
  const bottomRef = useRef(null);

  useEffect(() => {
    activeConversationRef.current = active?._id || "";
  }, [active]);

  useEffect(() => {
    const handleOnlineUsers = (ids) => {
      setOnlineUsers(Array.isArray(ids) ? ids.map(String) : []);
    };

    const handleNewMessage = (message) => {
      if (!message?._id) return;

      setConversations((prev) => {
        const index = prev.findIndex((item) => item._id === message.conversationId);
        if (index === -1) return prev;

        const target = prev[index];
        const updated = {
          ...target,
          lastMessage: message.text,
          updatedAt: message.createdAt || new Date().toISOString()
        };

        return [updated, ...prev.filter((item) => item._id !== message.conversationId)];
      });

      if (activeConversationRef.current === message.conversationId) {
        setMessages((prev) =>
          prev.some((item) => item._id === message._id) ? prev : [...prev, message]
        );
      }
    };

    socket.emit("join", user._id);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("newMessage", handleNewMessage);
      socket.disconnect();
    };
  }, [socket, user._id]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setError("");
        const [users, convos] = await Promise.all([
          authFetch("/api/users"),
          authFetch(`/api/conversations/${user._id}`)
        ]);

        if (!mounted) return;

        const safeUsers = Array.isArray(users) ? users : [];
        const safeConversations = Array.isArray(convos) ? convos : [];
        const userMap = {};

        safeUsers.forEach((person) => {
          userMap[person._id] = person;
        });
        userMap[user._id] = user;

        setUsersById(userMap);
        setPeople(safeUsers.filter((person) => person._id !== user._id));

        const sortedConversations = [...safeConversations].sort(sortByRecent);
        setConversations(sortedConversations);

        if (sortedConversations.length > 0) {
          setActive(sortedConversations[0]);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load messenger");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user, user._id]);

  useEffect(() => {
    if (!active?._id) {
      setMessages([]);
      return;
    }

    let mounted = true;
    socket.emit("joinConversation", active._id);

    const loadMessages = async () => {
      try {
        const payload = await authFetch(`/api/messages/${active._id}`);
        if (mounted) {
          setMessages(Array.isArray(payload) ? payload : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load messages");
        }
      }
    };

    loadMessages();

    return () => {
      mounted = false;
      socket.emit("leaveConversation", active._id);
    };
  }, [active, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const getFriendId = (conversation) =>
    (conversation?.members || []).map(String).find((id) => id !== String(user._id));

  const getFriend = (conversation) => usersById[getFriendId(conversation)];

  const startConversation = async (receiverId) => {
    const existing = conversations.find((conversation) =>
      (conversation.members || []).map(String).includes(String(receiverId))
    );

    if (existing) {
      setActive(existing);
      return;
    }

    try {
      const created = await authFetch("/api/conversations", {
        method: "POST",
        body: { receiverId }
      });

      setConversations((prev) => [created, ...prev]);
      setActive(created);
    } catch (err) {
      setError(err.message || "Failed to start conversation");
    }
  };

  const send = () => {
    if (!active?._id) return;
    const messageText = text.trim();
    if (!messageText) return;

    const receiverId = getFriendId(active);
    if (!receiverId) return;

    socket.emit("sendMessage", {
      conversationId: active._id,
      senderId: user._id,
      receiverId,
      text: messageText
    });

    setText("");
  };

  const isOnline = (userId) => onlineUsers.includes(String(userId));

  return (
    <section className="messenger-popup" aria-label="Messenger">
      <header className="messenger-header">
        <h3>Messenger</h3>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </header>

      <div className="messenger-body">
        <aside className="messenger-left">
          <h4>Start chat</h4>
          <div className="people-list">
            {people.map((person) => (
              <button
                type="button"
                key={person._id}
                className="person-row"
                onClick={() => startConversation(person._id)}
              >
                <img src={avatarUrl(person)} alt={person.name} />
                <div>
                  <strong>{person.name}</strong>
                  <small>{isOnline(person._id) ? "Online" : "Offline"}</small>
                </div>
              </button>
            ))}
          </div>

          <h4>Conversations</h4>
          <div className="conversation-list">
            {conversations.map((conversation) => {
              const friend = getFriend(conversation);
              const friendId = getFriendId(conversation);
              const activeClass = active?._id === conversation._id ? "active" : "";

              return (
                <button
                  type="button"
                  key={conversation._id}
                  className={`convo ${activeClass}`}
                  onClick={() => setActive(conversation)}
                >
                  <img src={avatarUrl(friend)} alt={friend?.name || "User"} />
                  <div>
                    <strong>{friend?.name || "Unknown user"}</strong>
                    <p>{conversation.lastMessage || "Say hello"}</p>
                  </div>
                  {isOnline(friendId) && <span className="online-dot" />}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="messenger-right">
          {loading ? (
            <p className="chat-empty">Loading messenger...</p>
          ) : active ? (
            <>
              <div className="chat-header">
                <div>
                  <strong>{getFriend(active)?.name || "Conversation"}</strong>
                  <small>
                    {isOnline(getFriendId(active)) ? "Online now" : "Currently offline"}
                  </small>
                </div>
              </div>

              <div className="messages">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`bubble ${message.senderId === user._id ? "me" : "them"}`}
                  >
                    <p>{message.text}</p>
                    <span>{formatTime(message.time || message.createdAt)}</span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="send-box">
                <input
                  placeholder="Type a message..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                />
                <button type="button" onClick={send}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <p className="chat-empty">Select or start a conversation.</p>
          )}

          {error && <p className="chat-error">{error}</p>}
        </section>
      </div>
    </section>
  );
}
