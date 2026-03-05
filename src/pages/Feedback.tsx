import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { feedbackApi } from "../api/feedbackApi";
import { attendeeApi } from "../api/attendeeApi";
import { useAppSelector } from "../store/hooks";

interface FeedbackForm {
  type: string;
  subject: string;
  message: string;
  email?: string;
}

interface AttendedSession {
  _id: string;
  title: string;
  speaker: string;
  timeSlot: string;
  expoId?: { title: string };
}

export function Feedback() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [attendedSessions, setAttendedSessions] = useState<AttendedSession[]>([]);
  const [feedbackMode, setFeedbackMode] = useState<"general" | "session">("general");
  const [sessionFeedback, setSessionFeedback] = useState({ sessionId: "", message: "" });
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeedbackForm>();

  useEffect(() => {
    if (user?.role === "attendee" && isAuthenticated) {
      attendeeApi.getMyRegistrations().then((res) => {
        const regs = res.data.registrations || [];
        const sessions = regs
          .filter((r: { type: string; sessionId?: { _id: string } }) => r.type === "session" && r.sessionId)
          .map((r: { sessionId: AttendedSession }) => r.sessionId);
        setAttendedSessions(sessions);
      }).catch(() => setAttendedSessions([]));
    }
  }, [user?.role, isAuthenticated]);

  const onSubmit = async (data: FeedbackForm) => {
    setError("");
    try {
      await feedbackApi.submit({
        type: data.type,
        subject: data.subject,
        message: data.message,
        email: isAuthenticated ? undefined : data.email,
      });
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to submit feedback");
    }
  };

  const onSubmitSessionFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionFeedback.sessionId || !sessionFeedback.message.trim()) return;
    setError("");
    setSessionSubmitting(true);
    try {
      await feedbackApi.submitSessionFeedback({
        sessionId: sessionFeedback.sessionId,
        message: sessionFeedback.message.trim(),
      });
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSessionSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="feedback-page">
        <div className="feedback-card">
          <h1>Thank You</h1>
          <p>Your feedback has been submitted. We appreciate your input.</p>
        </div>
      </div>
    );
  }

  const isAttendee = user?.role === "attendee";

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <h1>Feedback & Support</h1>
        <p className="feedback-intro">
          Submit suggestions, report issues, or request support. We value your input and will respond as soon as possible.
        </p>

        {isAttendee && attendedSessions.length > 0 && (
          <div className="feedback-mode-tabs">
            <button
              type="button"
              className={feedbackMode === "general" ? "active" : ""}
              onClick={() => setFeedbackMode("general")}
            >
              General Feedback
            </button>
            <button
              type="button"
              className={feedbackMode === "session" ? "active" : ""}
              onClick={() => setFeedbackMode("session")}
            >
              Session Feedback
            </button>
          </div>
        )}

        {feedbackMode === "session" && isAttendee && attendedSessions.length > 0 ? (
          <form onSubmit={onSubmitSessionFeedback} className="feedback-form">
            {error && <div className="error-msg">{error}</div>}
            <p className="feedback-intro feedback-intro--small">
              Give feedback for a session you attended. Only sessions you have booked are listed.
            </p>
            <div className="form-group">
              <label>Session</label>
              <select
                value={sessionFeedback.sessionId}
                onChange={(e) => setSessionFeedback((s) => ({ ...s, sessionId: e.target.value }))}
                required
              >
                <option value="">Select a session...</option>
                {attendedSessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title} — {s.speaker} {s.expoId && `(${s.expoId.title})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Your Feedback</label>
              <textarea
                rows={4}
                placeholder="Share your experience with this session..."
                value={sessionFeedback.message}
                onChange={(e) => setSessionFeedback((s) => ({ ...s, message: e.target.value }))}
                required
              />
            </div>
            <button type="submit" disabled={sessionSubmitting} className="btn-primary">
              {sessionSubmitting ? "Submitting…" : "Submit Session Feedback"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="feedback-form">
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label>Type</label>
              <select {...register("type")}>
                <option value="general">General Feedback</option>
                <option value="suggestion">Suggestion</option>
                <option value="issue">Report Issue / Bug</option>
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input type="text" placeholder="Subject" {...register("subject")} />
            </div>
            {!isAuthenticated && (
              <div className="form-group">
                <label>Email (required)</label>
                <input
                  type="email"
                  placeholder="Your email"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <span className="field-error">{errors.email.message}</span>
                )}
              </div>
            )}
            <div className="form-group">
              <label>Message</label>
              <textarea
                rows={4}
                placeholder="Your feedback..."
                {...register("message", { required: "Message is required" })}
              />
              {errors.message && (
                <span className="field-error">{errors.message.message}</span>
              )}
            </div>
            <button type="submit" className="btn-primary">Submit Feedback</button>
          </form>
        )}
      </div>
    </div>
  );
}
