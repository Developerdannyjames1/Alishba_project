import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { exhibitorApi } from "../../api/exhibitorApi";
import { applicationApi } from "../../api/applicationApi";
import { expoApi } from "../../api/expoApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import type { User } from "../../types";

interface ExpoApplication {
  _id: string;
  status: string;
  companyName: string;
  productsServices?: string;
  exhibitorId: { _id: string; name: string; email: string; company?: string };
  expoId: { _id: string; title: string; date: string; location: string } | { _id: string };
}

export function ExhibitorApproval() {
  const [activeTab, setActiveTab] = useState<"users" | "applications">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<ExpoApplication[]>([]);
  const [boothsByExpo, setBoothsByExpo] = useState<Record<string, { _id: string; boothNumber: string; status: string }[]>>({});
  const [allocatingBoothId, setAllocatingBoothId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadApplications = () => {
    applicationApi.getAllPending().then((res) => {
      const apps = (res.data.applications || []) as ExpoApplication[];
      setApplications(apps);
      const expoIds: string[] = [...new Set(apps.map((a) => (a.expoId as { _id: string })._id))];
      expoIds.forEach((expoId) => {
        expoApi.getBooths(expoId).then((br) => {
          const booths = br.data.booths || [];
          setBoothsByExpo((prev) => ({ ...prev, [expoId]: booths }));
        });
      });
    });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      exhibitorApi.getPendingAll().then((res) => setUsers(res.data.users || [])),
      applicationApi.getAllPending().then((res) => {
        const apps = (res.data.applications || []) as ExpoApplication[];
        setApplications(apps);
        const expoIds = [...new Set(apps.map((a) => (a.expoId as { _id: string })._id))];
        expoIds.forEach((expoId: string) => {
          expoApi.getBooths(expoId).then((br) => {
            const booths = br.data.booths || [];
            setBoothsByExpo((prev) => ({ ...prev, [expoId]: booths }));
          });
        });
      }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApproveUser = async (id: string) => {
    try {
      await exhibitorApi.approve(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      alert("Failed to approve");
    }
  };

  const handleApproveApplication = async (id: string) => {
    try {
      await applicationApi.approve(id);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch {
      alert("Failed to approve application");
    }
  };

  const handleRejectApplication = async (id: string) => {
    try {
      await applicationApi.reject(id);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch {
      alert("Failed to reject application");
    }
  };

  const handleAllocateBooth = async (boothId: string, exhibitorId: string) => {
    setAllocatingBoothId(boothId);
    try {
      await exhibitorApi.allocateBooth(boothId, exhibitorId);
      loadApplications();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Failed to allocate booth");
    } finally {
      setAllocatingBoothId(null);
    }
  };

  const pendingExhibitors = users.filter((u) => u.role === "exhibitor");
  const pendingOrganizers = users.filter((u) => u.role === "organizer");

  if (loading && users.length === 0 && applications.length === 0) {
    return <LoadingSpinner message="Loading exhibitor management..." />;
  }

  return (
    <div className="exhibitor-management">
      <h1>Exhibitor Management</h1>
      <p className="section-desc">
        View exhibitor registrations and applications. Approve or reject applications. Assign booth spaces.
      </p>
      <div className="role-tabs">
        <button
          type="button"
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Pending User Approvals ({(pendingExhibitors.length || 0) + (pendingOrganizers.length || 0)})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "applications" ? "active" : ""}`}
          onClick={() => setActiveTab("applications")}
        >
          Expo Applications ({applications.length})
        </button>
      </div>

      {activeTab === "users" && (
        <section className="exhibitor-approval-section">
          <p className="approval-hint">
            Exhibitors and organizers require approval before they can log in.
          </p>
          {users.length === 0 ? (
            <p>No pending user approvals</p>
          ) : (
            <div className="exhibitor-list">
              {pendingOrganizers.length > 0 && (
                <h2 className="role-section">Organizers ({pendingOrganizers.length})</h2>
              )}
              {pendingOrganizers.map((u) => (
                <div key={u._id} className="exhibitor-card">
                  <div>
                    <strong>{u.name}</strong>
                    <span className="role-badge organizer">Organizer</span>
                    <p>{u.email}</p>
                    {u.company && <p>Company: {u.company}</p>}
                  </div>
                  <button onClick={() => handleApproveUser(u._id)}>Approve</button>
                </div>
              ))}
              {pendingExhibitors.length > 0 && (
                <h2 className="role-section">Exhibitors ({pendingExhibitors.length})</h2>
              )}
              {pendingExhibitors.map((u) => (
                <div key={u._id} className="exhibitor-card">
                  <div>
                    <strong>{u.name}</strong>
                    <span className="role-badge exhibitor">Exhibitor</span>
                    <p>{u.email}</p>
                    {u.company && <p>Company: {u.company}</p>}
                  </div>
                  <button onClick={() => handleApproveUser(u._id)}>Approve</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "applications" && (
        <section className="expo-applications-section">
          {applications.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No pending expo applications"
              description="All expo applications have been reviewed."
            />
          ) : (
            <div className="application-list">
              {applications.map((app) => {
                const exhibitor = app.exhibitorId as { name: string; email: string; company?: string };
                const expo = app.expoId as { _id: string; title: string; date: string };
                const expoId = expo._id;
                const availableBooths = (boothsByExpo[expoId] || []).filter(
                  (b) => b.status === "available"
                );
                return (
                  <div key={app._id} className="application-card">
                    <div className="application-info">
                      <strong>{exhibitor.name}</strong>
                      <span>{exhibitor.company || "—"}</span>
                      <span className="application-expo">
                        {expo.title} — {new Date(expo.date).toLocaleDateString()}
                      </span>
                      {app.productsServices && (
                        <p className="products">{app.productsServices}</p>
                      )}
                    </div>
                    <div className="application-actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleApproveApplication(app._id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleRejectApplication(app._id)}
                      >
                        Reject
                      </button>
                      {availableBooths.length > 0 && (
                        <div className="booth-assign">
                          <select
                            onChange={(e) => {
                              const boothId = e.target.value;
                              if (boothId) {
                                handleAllocateBooth(boothId, (app.exhibitorId as { _id: string })._id);
                                e.target.value = "";
                              }
                            }}
                            disabled={!!allocatingBoothId}
                          >
                            <option value="">Assign booth...</option>
                            {availableBooths.map((b) => (
                              <option key={b._id} value={b._id}>
                                Booth {b.boothNumber}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <Link
                        to={`/expos/${expoId}`}
                        className="btn-sm btn-view"
                      >
                        View Expo
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
