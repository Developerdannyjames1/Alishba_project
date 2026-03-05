import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { expoApi } from "../../api/expoApi";
import { createSocket } from "../../utils/socket";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import type { Expo, Session } from "../../types";

interface ExpoWithSessions extends Expo {
  sessions?: Session[];
}

export function AdminSchedule() {
  const [expos, setExpos] = useState<ExpoWithSessions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpoId, setSelectedExpoId] = useState<string | null>(null);

  const loadExpos = useCallback((isInitial = true) => {
    expoApi
      .getAll()
      .then((res) => {
        const expoList = res.data.expos || [];
        setExpos(expoList);
        if (isInitial && expoList.length > 0) {
          setSelectedExpoId((prev) => prev || expoList[0]._id);
        }
      })
      .catch(() => setExpos([]))
      .finally(() => setLoading(false));
  }, []);

  const loadSessions = useCallback((expoId: string) => {
    expoApi
      .getSessions(expoId)
      .then((res) => {
        const sessions = res.data.sessions || [];
        setExpos((prev) =>
          prev.map((e) =>
            e._id === expoId ? { ...e, sessions } : e
          )
        );
      })
      .catch(() => {
        setExpos((prev) =>
          prev.map((e) =>
            e._id === expoId ? { ...e, sessions: [] } : e
          )
        );
      });
  }, []);

  useEffect(() => {
    loadExpos(true);
  }, [loadExpos]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = createSocket(token || undefined);
    socket.on("expos-list-updated", () => loadExpos(false));
    return () => {
      socket.off("expos-list-updated");
      socket.disconnect();
    };
  }, [loadExpos]);

  useEffect(() => {
    if (!selectedExpoId) return;
    loadSessions(selectedExpoId);
  }, [selectedExpoId, loadSessions]);

  useEffect(() => {
    if (!selectedExpoId) return;
    const token = localStorage.getItem("token");
    const socket = createSocket(token || undefined);
    socket.emit("join-expo", selectedExpoId);
    socket.on("sessions-updated", () => loadSessions(selectedExpoId));
    return () => {
      socket.emit("leave-expo", selectedExpoId);
      socket.off("sessions-updated");
      socket.disconnect();
    };
  }, [selectedExpoId, loadSessions]);

  const selectedExpo = expos.find((e) => e._id === selectedExpoId);

  if (loading) return <LoadingSpinner message="Loading schedule..." />;

  return (
    <div className="admin-schedule">
      <div className="page-header">
        <h1>Schedule Management</h1>
      </div>
      <p className="section-desc">
        Create and manage event schedules with time slots and sessions. Assign speakers, topics, and locations.
      </p>
      {expos.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No expos yet"
          description="Create an expo first to manage schedules."
          action={
            <Link to="/expos/new" className="btn-primary">
              Create Expo
            </Link>
          }
        />
      ) : (
        <div className="schedule-layout">
          <aside className="expo-sidebar">
            <h3>Select Expo</h3>
            <ul>
              {expos.map((expo) => (
                <li key={expo._id}>
                  <button
                    type="button"
                    className={selectedExpoId === expo._id ? "active" : ""}
                    onClick={() => setSelectedExpoId(expo._id)}
                  >
                    {expo.title}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <main className="schedule-content">
            {selectedExpo && (
              <>
                <div className="schedule-header">
                  <h2>{selectedExpo.title}</h2>
                  <Link
                    to={`/expos/${selectedExpo._id}`}
                    className="btn-primary"
                  >
                    Manage Sessions
                  </Link>
                </div>
                {(!selectedExpo.sessions || selectedExpo.sessions.length === 0) ? (
                  <EmptyState
                    icon="📅"
                    title="No sessions"
                    description="Add sessions to this expo to build the schedule."
                    action={
                      <Link to={`/expos/${selectedExpo._id}`} className="btn-primary">
                        Add Sessions
                      </Link>
                    }
                  />
                ) : (
                  <ul className="session-schedule-list">
                    {selectedExpo.sessions
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(a.timeSlot).getTime() -
                          new Date(b.timeSlot).getTime()
                      )
                      .map((s) => (
                        <li key={s._id} className="session-item">
                          <div className="session-time">
                            {new Date(s.timeSlot).toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="session-info">
                            <strong>{s.title}</strong>
                            <span className="session-speaker">{s.speaker}</span>
                            {s.location && (
                              <span className="session-location">
                                @ {s.location}
                              </span>
                            )}
                            <span className={`session-type ${s.type}`}>
                              {s.type}
                            </span>
                          </div>
                          <Link
                            to={`/expos/${selectedExpo._id}`}
                            className="btn-sm btn-edit"
                          >
                            Edit
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
