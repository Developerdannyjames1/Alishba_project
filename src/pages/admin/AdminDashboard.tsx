import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { analyticsApi } from "../../api/analyticsApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

interface Analytics {
  totalExpos: number;
  totalUsers: number;
  totalExhibitors: number;
  totalAttendees: number;
  totalOrganizers?: number;
  pendingExhibitors: number;
  pendingOrganizers?: number;
  totalBooths?: number;
  occupiedBooths?: number;
  totalRegistrations?: number;
  totalBookmarks?: number;
  upcomingExpos: { _id: string; title: string; date: string }[];
  sessionPopularity?: { sessionTitle: string; speaker: string; registrations: number }[];
  boothTraffic?: { expoTitle: string; occupiedBooths: number }[];
}

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getDashboard()
      .then((res) => setAnalytics(res.data.analytics))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (!analytics) return <div className="error">Failed to load analytics</div>;

  const pendingCount = (analytics.pendingExhibitors || 0) + (analytics.pendingOrganizers || 0);

  return (
    <div className="admin-dashboard">
      <div className="portal-header">
        <h1>Admin / Organizer Dashboard</h1>
        <p className="section-desc">
          Manage expos, exhibitors, schedules, and view real-time analytics.
        </p>
      </div>

      <div className="dashboard-actions">
        <Link to="/admin/expos" className="action-card">
          <span className="action-icon">📋</span>
          <span>Expo Management</span>
          <small>Create, edit, delete expos & allocate booths</small>
        </Link>
        <Link to="/admin/exhibitors" className="action-card">
          <span className="action-icon">🏢</span>
          <span>Exhibitor Management</span>
          <small>Approve applications & assign booths</small>
        </Link>
        <Link to="/admin/schedule" className="action-card">
          <span className="action-icon">📅</span>
          <span>Schedule Management</span>
          <small>Manage sessions, speakers & locations</small>
        </Link>
        <Link to="/admin/users" className="action-card">
          <span className="action-icon">👥</span>
          <span>User Management</span>
          <small>View and manage all users</small>
        </Link>
      </div>

      <h2 className="dashboard-section-title">
        <span className="dashboard-section-icon">📈</span>
        Analytics & Reporting
      </h2>
      <div className="stats-grid">
        <Link to="/admin/expos" className="stat-card stat-card-link">
          <h3>{analytics.totalExpos}</h3>
          <p>Total Expos</p>
        </Link>
        <Link to="/admin/users" className="stat-card stat-card-link">
          <h3>{analytics.totalUsers}</h3>
          <p>Total Users</p>
        </Link>
        <Link to="/admin/users?role=exhibitor" className="stat-card stat-card-link">
          <h3>{analytics.totalExhibitors}</h3>
          <p>Exhibitors</p>
        </Link>
        <Link to="/admin/users?role=attendee" className="stat-card stat-card-link">
          <h3>{analytics.totalAttendees}</h3>
          <p>Attendees</p>
        </Link>
        {analytics.totalOrganizers != null && (
          <Link to="/admin/users?role=organizer" className="stat-card stat-card-link">
            <h3>{analytics.totalOrganizers}</h3>
            <p>Organizers</p>
          </Link>
        )}
        <Link
          to="/admin/exhibitors"
          className="stat-card stat-card-link highlight"
        >
          <h3>{pendingCount}</h3>
          <p>Pending Approval</p>
        </Link>
        {analytics.totalBooths != null && (
          <div className="stat-card">
            <h3>{analytics.occupiedBooths}/{analytics.totalBooths}</h3>
            <p>Booths Occupied</p>
          </div>
        )}
        {analytics.totalRegistrations != null && (
          <div className="stat-card">
            <h3>{analytics.totalRegistrations}</h3>
            <p>Expo Registrations</p>
          </div>
        )}
        {analytics.totalBookmarks != null && (
          <div className="stat-card">
            <h3>{analytics.totalBookmarks}</h3>
            <p>Session Bookmarks</p>
          </div>
        )}
      </div>

      <section className="dashboard-section upcoming-section">
        <h2 className="dashboard-section-title">
          <span className="dashboard-section-icon">📅</span>
          Upcoming Expos
        </h2>
        {analytics.upcomingExpos?.length ? (
          <div className="expo-grid expo-grid--compact">
            {analytics.upcomingExpos.map((expo) => (
              <Link
                key={expo._id}
                to={`/expos/${expo._id}`}
                className="expo-card expo-card--link"
              >
                <h3>{expo.title}</h3>
                <p className="expo-card-date">
                  {new Date(expo.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <span className="expo-card-cta">View details →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <p>No upcoming expos</p>
          </div>
        )}
      </section>

      {analytics.sessionPopularity && analytics.sessionPopularity.length > 0 && (
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">
            <span className="dashboard-section-icon">📊</span>
            Session Popularity
          </h2>
          <div className="analytics-card-grid">
            {analytics.sessionPopularity.map((s, i) => (
              <div key={i} className="analytics-card analytics-card--session">
                <div className="analytics-card__content">
                  <h4>{s.sessionTitle}</h4>
                  <p className="analytics-card__meta">{s.speaker}</p>
                </div>
                <div className="analytics-card__stat">
                  <span className="analytics-card__number">{s.registrations}</span>
                  <span className="analytics-card__label">registrations</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {analytics.boothTraffic && analytics.boothTraffic.length > 0 && (
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">
            <span className="dashboard-section-icon">🏢</span>
            Booth Traffic by Expo
          </h2>
          <div className="analytics-card-grid">
            {analytics.boothTraffic.map((b, i) => (
              <div key={i} className="analytics-card analytics-card--booth">
                <div className="analytics-card__content">
                  <h4>{b.expoTitle}</h4>
                </div>
                <div className="analytics-card__stat">
                  <span className="analytics-card__number">{b.occupiedBooths}</span>
                  <span className="analytics-card__label">booths occupied</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
