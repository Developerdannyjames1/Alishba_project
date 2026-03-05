import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { userApi } from "../../api/userApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import type { User } from "../../types";

const ROLES = [
  { value: "all", label: "All Users" },
  { value: "exhibitor", label: "Exhibitors" },
  { value: "attendee", label: "Attendees" },
  { value: "organizer", label: "Organizers" },
] as const;

type RoleFilter = "all" | "exhibitor" | "attendee" | "organizer";

export function UserManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") as RoleFilter | null;
  const [activeRole, setActiveRole] = useState<RoleFilter>(
    roleFromUrl && ["all", "exhibitor", "attendee", "organizer"].includes(roleFromUrl)
      ? roleFromUrl
      : "all"
  );
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    const role = searchParams.get("role") as RoleFilter | null;
    if (role && ["all", "exhibitor", "attendee", "organizer"].includes(role)) {
      setActiveRole(role);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    userApi
      .getUsers(activeRole === "all" ? undefined : activeRole)
      .then((res) => setUsers(res.data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [activeRole]);

  const handleEdit = (user: User) => {
    setEditingId(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      phone: user.phone,
      isApproved: user.isApproved,
      description: (user as { description?: string }).description,
      productsServices: (user as { productsServices?: string }).productsServices,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      const res = await userApi.updateUser(editingId, editForm);
      setUsers((prev) =>
        prev.map((u) => (u._id === editingId ? res.data.user : u))
      );
      setEditingId(null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="user-management">
      <h1>User Management</h1>
      <p>View and edit users by role.</p>

      <div className="role-tabs">
        {ROLES.map((r) => (
          <button
            key={r.value}
            className={`tab ${activeRole === r.value ? "active" : ""}`}
            onClick={() => {
              setActiveRole(r.value);
              setSearchParams(r.value === "all" ? {} : { role: r.value });
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading users..." />
      ) : (
        <div className="users-table">
          {users.length === 0 ? (
            <p>No users found for this role.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Phone</th>
                  {(activeRole === "exhibitor" || activeRole === "all") && (
                    <th>Approved</th>
                  )}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    {editingId === user._id ? (
                      <>
                        <td>
                          <input
                            value={editForm.name || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, name: e.target.value }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            value={editForm.email || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, email: e.target.value }))
                            }
                          />
                        </td>
                        <td>
                          <select
                            value={editForm.role || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, role: e.target.value as User["role"] }))
                            }
                          >
                            <option value="attendee">Attendee</option>
                            <option value="exhibitor">Exhibitor</option>
                            <option value="organizer">Organizer</option>
                          </select>
                        </td>
                        <td>
                          <input
                            value={editForm.company || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, company: e.target.value }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editForm.phone || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, phone: e.target.value }))
                            }
                          />
                        </td>
                        {(activeRole === "exhibitor" || activeRole === "all") && (
                          <td>
                            <input
                              type="checkbox"
                              checked={editForm.isApproved ?? false}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, isApproved: e.target.checked }))
                              }
                            />
                          </td>
                        )}
                        <td className="actions-cell">
                          <button onClick={handleSave} className="btn-primary">Save</button>
                          <button onClick={handleCancel} className="btn-secondary">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.company || "—"}</td>
                        <td>{user.phone || "—"}</td>
                        {(activeRole === "exhibitor" || activeRole === "all") && (
                          <td>
                            {user.role === "exhibitor" ? (
                              <span className={`status-badge ${user.isApproved ? "approved" : "pending"}`}>
                                {user.isApproved ? "Yes" : "No"}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                        <td>
                          <button onClick={() => handleEdit(user)} className="btn-sm btn-edit">Edit</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editingId && (activeRole === "exhibitor" || activeRole === "all") && (
        <div className="edit-panel">
          <h3>Additional fields (Exhibitor)</h3>
          <div>
            <label>Description</label>
            <textarea
              value={editForm.description || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div>
            <label>Products/Services</label>
            <textarea
              value={editForm.productsServices || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, productsServices: e.target.value }))
              }
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}
