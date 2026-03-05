import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { expoApi } from "../../api/expoApi";
import { createSocket } from "../../utils/socket";
import { useAppSelector } from "../../store/hooks";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import type { Expo } from "../../types";

export function ExpoList() {
  const [expos, setExpos] = useState<Expo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const loadExpos = (silent = false) => {
    if (!silent) setLoading(true);
    expoApi
      .getAll()
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
    socket.on("expos-list-updated", () => loadExpos(true));
    return () => {
      socket.off("expos-list-updated");
      socket.disconnect();
    };
  }, []);

  const canCreate = user?.role === "admin" || user?.role === "organizer";

  return (
    <div className="expo-list-page">
      <div className="page-header">
        <h1>Expos</h1>
        {canCreate && (
          <button onClick={() => navigate("/expos/new")}>Create Expo</button>
        )}
      </div>
      {loading ? (
        <LoadingSpinner message="Loading expos..." />
      ) : expos.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No expos yet"
          description={canCreate ? "Create your first expo to get started." : "No expos are available at the moment."}
          action={canCreate ? (
            <button onClick={() => navigate("/expos/new")} className="btn-primary">
              Create Expo
            </button>
          ) : undefined}
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
              <p>{new Date(expo.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
              <span className={`status-badge ${expo.status}`}>{expo.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
