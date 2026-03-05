import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { expoApi } from "../api/expoApi";
import { createSocket } from "../utils/socket";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { useState } from "react";
import type { Expo } from "../types";

export function Home() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [expos, setExpos] = useState<Expo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpos = () => {
    expoApi
      .getAll({ status: "published", limit: 6 })
      .then((res) => setExpos(res.data.expos || []))
      .catch(() => setExpos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpos();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = createSocket(token || undefined);
    socket.on("expos-list-updated", () => loadExpos());
    return () => {
      socket.off("expos-list-updated");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin" || user.role === "organizer") navigate("/admin");
      else if (user.role === "exhibitor") navigate("/exhibitor");
      else if (user.role === "attendee") navigate("/attendee");
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Event Sphere Management</h1>
        <p>Discover, register, and manage expos — all in one place</p>
      </section>

      <section className="expos-section">
        <h2>Upcoming Expos</h2>
        {loading ? (
          <LoadingSpinner message="Loading expos..." />
        ) : expos.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No upcoming expos"
            description="Check back soon for new events. Expos will appear here when published."
          />
        ) : (
          <div className="expo-grid">
            {expos.map((expo) => (
              <div
                key={expo._id}
                className="expo-card"
                onClick={() => navigate(`/expos/${expo._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/expos/${expo._id}`)}
              >
                <h3>{expo.title}</h3>
                <p>{expo.location}</p>
                <p>{new Date(expo.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                {expo.theme && <span className="expo-theme">{expo.theme}</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
