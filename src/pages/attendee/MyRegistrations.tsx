import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { attendeeApi } from "../../api/attendeeApi";
import { bookmarkApi } from "../../api/bookmarkApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

interface Registration {
  _id: string;
  type: string;
  expoId: { _id?: string; title: string; date: string; location: string };
  sessionId?: { _id?: string; title: string; speaker: string; timeSlot: string };
}

interface Bookmark {
  _id: string;
  sessionId: {
    _id: string;
    title: string;
    speaker: string;
    timeSlot: string;
    type?: string;
    location?: string;
    expoId?: { _id: string; title: string; date: string; location: string };
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MyRegistrations() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingBookmarkId, setRemovingBookmarkId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      attendeeApi.getMyRegistrations(),
      bookmarkApi.getMyBookmarks(),
    ])
      .then(([regRes, bmRes]) => {
        setRegistrations(regRes.data.registrations || []);
        setBookmarks(bmRes.data.bookmarks || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemoveBookmark = async (sessionId: string) => {
    setRemovingBookmarkId(sessionId);
    try {
      await bookmarkApi.removeBookmark(sessionId);
      setBookmarks((prev) => prev.filter((b) => b.sessionId._id !== sessionId));
    } catch {
      alert("Failed to remove bookmark");
    } finally {
      setRemovingBookmarkId(null);
    }
  };

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingBookmarks = bookmarks.filter((b) => {
    const slot = new Date(b.sessionId?.timeSlot || 0);
    return slot >= now && slot <= in7days;
  });
  const soonBookmarks = upcomingBookmarks.filter((b) => {
    const slot = new Date(b.sessionId?.timeSlot || 0);
    return slot <= in24h;
  });

  if (loading) return <LoadingSpinner message="Loading your registrations..." />;

  return (
    <div className="my-registrations">
      <div className="portal-header">
        <div className="page-header">
          <h1>My Registrations</h1>
          <button onClick={loadData} className="btn-refresh">
            Refresh
          </button>
        </div>
        <p className="page-subtitle">
          Your registered expos, booked sessions, and bookmarked sessions. Receive reminders for bookmarked sessions.
        </p>
      </div>

      {soonBookmarks.length > 0 && (
        <div className="reminder-banner">
          <h3>Reminder: Sessions starting soon</h3>
          <p>{soonBookmarks.length} bookmarked session(s) in the next 24 hours</p>
          <ul>
            {soonBookmarks.map((b) => (
              <li key={b._id}>
                <strong>{b.sessionId?.title}</strong> — {formatDateTime(b.sessionId?.timeSlot || "")}
                {b.sessionId?.expoId?._id && (
                  <button
                    className="btn-view-small"
                    onClick={() => navigate(`/expos/${b.sessionId?.expoId?._id}`)}
                  >
                    View
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="empty-state-card">
          <p>No registrations yet.</p>
          <p className="empty-hint">Browse expos and register for events to see them here.</p>
          <button onClick={() => navigate("/expos")} className="btn-primary">
            Browse Expos
          </button>
        </div>
      ) : (
        <div className="registration-cards">
          {registrations.map((r) => (
            <div key={r._id} className="registration-card">
              <div className="card-header">
                <h3>{r.expoId?.title || "Expo"}</h3>
                <span className={`badge badge-${r.type}`}>
                  {r.type === "expo" ? "Expo" : "Session"}
                </span>
              </div>
              <div className="card-details">
                <div className="detail-row">
                  <span className="label">Location</span>
                  <span className="value">{r.expoId?.location || "—"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date</span>
                  <span className="value">{formatDate(r.expoId?.date || "")}</span>
                </div>
                {r.sessionId && (
                  <div className="detail-row session-info">
                    <span className="label">Session</span>
                    <span className="value">
                      {r.sessionId.title} with {r.sessionId.speaker}
                    </span>
                  </div>
                )}
              </div>
              {r.expoId?._id && (
                <button
                  className="btn-view"
                  onClick={() => navigate(`/expos/${r.expoId._id}`)}
                >
                  View Expo
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="bookmarks-section">
        <h2>Bookmarked Sessions</h2>
        {upcomingBookmarks.length > 0 && (
          <p className="upcoming-hint">
            {upcomingBookmarks.length} session(s) coming up in the next 7 days — don&apos;t miss them!
          </p>
        )}
        {bookmarks.length === 0 ? (
          <div className="empty-state-card small">
            <p>No bookmarked sessions.</p>
            <p className="empty-hint">Browse expos, bookmark sessions of interest, and receive reminders before they start.</p>
            <button onClick={() => navigate("/expos")} className="btn-primary">
              Browse Sessions
            </button>
          </div>
        ) : (
          <div className="bookmark-cards">
            {bookmarks.map((b) => {
              const slot = new Date(b.sessionId?.timeSlot || 0);
              const isUpcoming = slot >= now && slot <= in7days;
              return (
              <div
                key={b._id}
                className={`bookmark-card ${isUpcoming ? "upcoming" : ""}`}
              >
                <div className="card-header">
                  <h3>{b.sessionId?.title}</h3>
                </div>
                <div className="card-details">
                  <div className="detail-row">
                    <span className="label">Speaker</span>
                    <span className="value">{b.sessionId?.speaker}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">When</span>
                    <span className="value">
                      {formatDateTime(b.sessionId?.timeSlot || "")}
                    </span>
                  </div>
                  {b.sessionId?.type && (
                    <div className="detail-row">
                      <span className="label">Type</span>
                      <span className="value">{b.sessionId.type}</span>
                    </div>
                  )}
                  {b.sessionId?.expoId && (
                    <div className="detail-row">
                      <span className="label">Expo</span>
                      <span className="value">{b.sessionId.expoId.title}</span>
                    </div>
                  )}
                </div>
                <div className="card-actions">
                  <button
                    className="btn-view"
                    onClick={() =>
                      navigate(`/expos/${b.sessionId?.expoId?._id}`)
                    }
                  >
                    View
                  </button>
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveBookmark(b.sessionId._id)}
                    disabled={removingBookmarkId === b.sessionId._id}
                  >
                    {removingBookmarkId === b.sessionId._id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
