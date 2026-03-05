import { useEffect, useState } from "react";
import { feedbackApi } from "../../api/feedbackApi";

interface FeedbackItem {
  _id: string;
  type: string;
  subject: string;
  message: string;
  email?: string;
  status: string;
  createdAt: string;
  userId?: { name?: string; email?: string };
  sessionId?: { title?: string; speaker?: string };
}

export function FeedbackList() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedbackApi
      .getAll()
      .then((res) => setFeedback(res.data.feedback || []))
      .catch(() => setFeedback([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="feedback-list">
      <h1>User Feedback</h1>
      {feedback.length === 0 ? (
        <p>No feedback yet.</p>
      ) : (
        <ul className="feedback-items">
          {feedback.map((f) => (
            <li key={f._id} className="feedback-item">
              <div className="feedback-meta">
                <span className="type">{f.type}</span>
                <span className="date">
                  {new Date(f.createdAt).toLocaleString()}
                </span>
              </div>
              {f.subject && <strong>{f.subject}</strong>}
              {f.type === "session" && f.sessionId && (
                <p className="feedback-session">Session: {f.sessionId.title} — {f.sessionId.speaker}</p>
              )}
              <p>{f.message}</p>
              <p className="feedback-contact">
                {f.userId?.email || f.email || "Anonymous"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
