import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "../components/common/Layout";
import { ProtectedRoute } from "../utils/ProtectedRoute";
import { Home } from "../pages/Home";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { Feedback } from "../pages/Feedback";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminExpos } from "../pages/admin/AdminExpos";
import { AdminSchedule } from "../pages/admin/AdminSchedule";
import { ExhibitorApproval } from "../pages/admin/ExhibitorApproval";
import { FeedbackList } from "../pages/admin/FeedbackList";
import { UserManagement } from "../pages/admin/UserManagement";
import { ExpoList } from "../pages/expos/ExpoList";
import { ExpoDetail } from "../pages/expos/ExpoDetail";
import { ExpoForm } from "../pages/expos/ExpoForm";
import { MyRegistrations } from "../pages/attendee/MyRegistrations";
import { ExhibitorDashboard } from "../pages/exhibitor/ExhibitorDashboard";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="expos" element={<ExpoList />} />
          <Route path="expos/new" element={<ExpoForm />} />
          <Route path="expos/:id" element={<ExpoDetail />} />
          <Route
            path="expos/:id/edit"
            element={
              <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                <ExpoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/expos"
            element={
              <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                <AdminExpos />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/schedule"
            element={
              <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                <AdminSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/exhibitors"
            element={
              <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                <ExhibitorApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/feedback"
            element={
              <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                <FeedbackList />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendee"
            element={
              <ProtectedRoute allowedRoles={["attendee"]}>
                <MyRegistrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="exhibitor"
            element={
              <ProtectedRoute allowedRoles={["exhibitor"]}>
                <ExhibitorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
