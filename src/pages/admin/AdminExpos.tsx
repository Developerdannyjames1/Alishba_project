import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { expoApi } from "../../api/expoApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import type { Expo } from "../../types";

export function AdminExpos() {
  const [expos, setExpos] = useState<Expo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpos = () => {
    expoApi
      .getAll()
      .then((res) => setExpos(res.data.expos || []))
      .catch(() => setExpos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpos();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete expo "${title}"? This cannot be undone.`)) return;
    try {
      await expoApi.delete(id);
      setExpos((prev) => prev.filter((e) => e._id !== id));
    } catch {
      alert("Failed to delete expo");
    }
  };

  if (loading) return <LoadingSpinner message="Loading expos..." />;

  return (
    <div className="admin-expos">
      <div className="page-header">
        <h1>Expo Management</h1>
        <Link to="/expos/new" className="btn-primary">
          Create Expo
        </Link>
      </div>
      <p className="section-desc">
        Create, edit, and delete expo events. Manage details and allocate booth spaces on the floor plan.
      </p>
      {expos.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No expos yet"
          description="Create your first expo to get started."
          action={
            <Link to="/expos/new" className="btn-primary">
              Create Expo
            </Link>
          }
        />
      ) : (
        <div className="admin-expo-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Theme</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expos.map((expo) => (
                <tr key={expo._id}>
                  <td>
                    <Link to={`/expos/${expo._id}`} className="expo-link">
                      {expo.title}
                    </Link>
                  </td>
                  <td>{new Date(expo.date).toLocaleDateString()}</td>
                  <td>{expo.location}</td>
                  <td>{expo.theme || "—"}</td>
                  <td>
                    <span className={`status-badge ${expo.status}`}>
                      {expo.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link
                      to={`/expos/${expo._id}/edit`}
                      className="btn-sm btn-edit"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/expos/${expo._id}`}
                      className="btn-sm btn-view"
                    >
                      Booths
                    </Link>
                    <button
                      type="button"
                      className="btn-sm btn-delete"
                      onClick={() => handleDelete(expo._id, expo.title)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
