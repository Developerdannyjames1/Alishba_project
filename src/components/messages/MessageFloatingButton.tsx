import { useState, useEffect, useCallback } from "react";
import { messageApi } from "../../api/messageApi";
import { useAppSelector } from "../../store/hooks";
import { createSocket } from "../../utils/socket";
import "./MessageFloatingButton.css";

interface Message {
  _id: string;
  fromUser: { _id: string; name: string; email?: string; company?: string } | string;
  toUser: { _id: string; name: string; email?: string; company?: string } | string;
  subject?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function getUserId(u: { _id: string } | string): string {
  return typeof u === "string" ? u : u._id;
}
function userDisplay(u: { _id: string; name?: string; company?: string } | string): { _id: string; name: string; company?: string } {
  if (typeof u === "string") return { _id: u, name: "Unknown" };
  return { _id: u._id, name: u.name ?? "Unknown", company: u.company };
}

interface Contact {
  _id: string;
  name: string;
  email?: string;
  company?: string;
  role: string;
  avatar?: string;
}

export function MessageFloatingButton() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "contacts">("chats");
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [composeMessage, setComposeMessage] = useState("");
  const [sending, setSending] = useState(false);

  const loadData = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    Promise.all([
      messageApi.getInbox(),
      messageApi.getSent(),
      messageApi.getContacts(),
    ])
      .then(([inboxRes, sentRes, contactsRes]) => {
        setInbox(inboxRes.data.messages || []);
        setSent(sentRes.data.messages || []);
        setContacts(contactsRes.data.contacts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Load data when panel opens, and on mount for badge count
  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [open, isAuthenticated, loadData]);

  // Real-time: listen for new messages when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("token");
    const socket = createSocket(token || undefined);
    socket.on("new-message", () => {
      loadData();
      if (typeof document !== "undefined" && document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("New message", { body: "You have a new message" });
      }
    });
    return () => {
      socket.off("new-message");
      socket.disconnect();
    };
  }, [isAuthenticated, loadData]);

  // Build conversation partners from inbox + sent
  const getConversations = () => {
    const map = new Map<
      string,
      { user: { _id: string; name: string; company?: string }; lastMessage: string; lastAt: string; unread: number }
    >();
    inbox.forEach((m) => {
      const id = getUserId(m.fromUser);
      const existing = map.get(id);
      const from = userDisplay(m.fromUser);
      if (!existing || new Date(m.createdAt) > new Date(existing.lastAt)) {
        map.set(id, {
          user: { _id: from._id, name: from.name, company: from.company },
          lastMessage: m.message.slice(0, 50) + (m.message.length > 50 ? "…" : ""),
          lastAt: m.createdAt,
          unread: (existing?.unread || 0) + (m.read ? 0 : 1),
        });
      } else if (!m.read) {
        const e = map.get(id)!;
        e.unread += 1;
      }
    });
    sent.forEach((m) => {
      const id = getUserId(m.toUser);
      const existing = map.get(id);
      const to = userDisplay(m.toUser);
      if (!existing || new Date(m.createdAt) > new Date(existing.lastAt)) {
        map.set(id, {
          user: { _id: to._id, name: to.name, company: to.company },
          lastMessage: "You: " + m.message.slice(0, 40) + (m.message.length > 40 ? "…" : ""),
          lastAt: m.createdAt,
          unread: existing?.unread || 0,
        });
      }
    });
    return Array.from(map.entries())
      .map(([, v]) => v)
      .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  };

  const conversations = getConversations();

  const getThreadWithUser = (userId: string) => {
    const thread = [
      ...inbox.filter((m) => getUserId(m.fromUser) === userId).map((m) => ({ ...m, direction: "in" as const })),
      ...sent.filter((m) => getUserId(m.toUser) === userId).map((m) => ({ ...m, direction: "out" as const })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return thread;
  };

  const selectedContact = contacts.find((c) => c._id === selectedUserId);
  const selectedConversation = conversations.find((c) => c.user._id === selectedUserId);
  const selectedName = selectedContact?.name ?? selectedConversation?.user.name ?? "Unknown";
  const thread = selectedUserId ? getThreadWithUser(selectedUserId) : [];

  const isMessageToMe = (m: Message) => {
    const toId = typeof m.toUser === "object" && m.toUser ? m.toUser._id : m.toUser;
    return toId === user?._id;
  };

  // Mark all unread messages from selected user as read when opening the chat
  useEffect(() => {
    if (!selectedUserId || !user?._id) return;
    const unreadFromUser = inbox.filter(
      (m) => getUserId(m.fromUser) === selectedUserId && !m.read && isMessageToMe(m)
    );
    if (unreadFromUser.length === 0) return;
    const ids = unreadFromUser.map((m) => m._id);
    Promise.all(ids.map((id) => messageApi.markRead(id))).then(() => {
      setInbox((prev) =>
        prev.map((m) => (ids.includes(m._id) ? { ...m, read: true } : m))
      );
      loadData();
    });
  }, [selectedUserId, user?._id, inbox, loadData]);

  const handleSend = async () => {
    if (!selectedUserId || !composeMessage.trim()) return;
    setSending(true);
    try {
      await messageApi.send({ toUserId: selectedUserId, message: composeMessage.trim() });
      setComposeMessage("");
      loadData();
    } catch {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = (msg: Message) => {
    if (!msg.read && isMessageToMe(msg)) {
      messageApi.markRead(msg._id).then(() => {
        setInbox((prev) => prev.map((m) => (m._id === msg._id ? { ...m, read: true } : m)));
        loadData();
      });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        type="button"
        className="message-floating-btn"
        onClick={() => {
          setOpen(!open);
          if (!open && typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission();
          }
        }}
        title="Messages"
        aria-label="Open messages"
      >
        <span className="message-floating-icon">💬</span>
        {!open && inbox.some((m) => !m.read) && (
          <span className="message-floating-badge">{inbox.filter((m) => !m.read).length}</span>
        )}
      </button>

      {open && (
        <div className="message-panel-overlay" onClick={() => setOpen(false)}>
          <div className="message-panel" onClick={(e) => e.stopPropagation()}>
            <div className="message-panel-header">
              <h3>Messages</h3>
              <button type="button" className="message-panel-close" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>

            {selectedUserId ? (
              <div className="message-panel-thread">
                <button
                  type="button"
                  className="message-panel-back"
                  onClick={() => {
                    setSelectedUserId(null);
                    setComposeMessage("");
                  }}
                >
                  ← Back
                </button>
                <h4>{selectedName}</h4>
                <div className="message-thread-messages">
                  {thread.map((m) => (
                    <div
                      key={m._id}
                      className={`message-bubble message-bubble--${m.direction}`}
                      onClick={() => m.direction === "in" && handleMarkRead(m)}
                    >
                      <p>{m.message}</p>
                      <span className="message-bubble-time">
                        {new Date(m.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="message-compose">
                  <textarea
                    placeholder="Type a message..."
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-send-message"
                    onClick={handleSend}
                    disabled={!composeMessage.trim() || sending}
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="message-panel-tabs">
                  <button
                    type="button"
                    className={activeTab === "chats" ? "active" : ""}
                    onClick={() => setActiveTab("chats")}
                  >
                    Chats ({conversations.length})
                  </button>
                  <button
                    type="button"
                    className={activeTab === "contacts" ? "active" : ""}
                    onClick={() => setActiveTab("contacts")}
                  >
                    Contacts ({contacts.length})
                  </button>
                </div>

                <div className="message-panel-list">
                  {loading ? (
                    <p className="message-panel-loading">Loading…</p>
                  ) : activeTab === "chats" ? (
                    conversations.length === 0 ? (
                      <p className="message-panel-empty">No conversations yet. Start by messaging a contact.</p>
                    ) : (
                      conversations.map((c) => (
                        <button
                          key={c.user._id}
                          type="button"
                          className="message-list-item"
                          onClick={() => setSelectedUserId(c.user._id)}
                        >
                          <div className="message-list-item-avatar">
                            {(c.user.name?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div className="message-list-item-content">
                            <strong>{c.user.name}</strong>
                            {c.user.company && <span className="message-list-item-meta">{c.user.company}</span>}
                            <p>{c.lastMessage}</p>
                          </div>
                          {c.unread > 0 && <span className="message-list-item-badge">{c.unread}</span>}
                        </button>
                      ))
                    )
                  ) : contacts.length === 0 ? (
                    <p className="message-panel-empty">No contacts available.</p>
                  ) : (
                    contacts.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        className="message-list-item"
                        onClick={() => setSelectedUserId(c._id)}
                      >
                        <div className="message-list-item-avatar">
                          {(c.name?.[0] ?? "?").toUpperCase()}
                        </div>
                        <div className="message-list-item-content">
                          <strong>{c.name}</strong>
                          <span className="message-list-item-meta">
                            {c.role} {c.company && `· ${c.company}`}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
