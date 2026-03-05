import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/authSlice";
import { MessageFloatingButton } from "../messages/MessageFloatingButton";

export function Layout() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          Event Sphere Management
        </Link>
        <nav className="nav">
          {isAuthenticated ? (
            <>
              <Link to="/expos">Expos</Link>
              {(user?.role === "admin" || user?.role === "organizer") && (
                <>
                  <Link to="/admin">Dashboard</Link>
                  <Link to="/admin/expos">Expos</Link>
                  <Link to="/admin/exhibitors">Exhibitors</Link>
                  <Link to="/admin/schedule">Schedule</Link>
                  <Link to="/admin/users">Users</Link>
                  <Link to="/admin/feedback">Feedback</Link>
                </>
              )}
              {user?.role === "exhibitor" && (
                <Link to="/exhibitor">My Booths</Link>
              )}
              {user?.role === "attendee" && (
                <Link to="/attendee">My Registrations</Link>
              )}
              <span className="user-role">{user?.role}</span>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
          <Link to="/feedback" title="Feedback & Support">Feedback</Link>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <MessageFloatingButton />
    </div>
  );
}
