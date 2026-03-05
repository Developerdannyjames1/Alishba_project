import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { exhibitorApi } from "../../api/exhibitorApi";
import { applicationApi } from "../../api/applicationApi";
import { messageApi } from "../../api/messageApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";

interface Booth {
  _id: string;
  boothNumber: string;
  status: string;
  description?: string;
  productsServices?: string;
  staffInfo?: string;
  expoId: { _id: string; title: string; date: string; location: string };
}

interface Application {
  _id: string;
  status: string;
  companyName?: string;
  productsServices?: string;
  expoId: { title: string; date: string; _id: string };
}

export function ExhibitorDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingBoothId, setEditingBoothId] = useState<string | null>(null);
  const [boothEdit, setBoothEdit] = useState({ description: "", productsServices: "", staffInfo: "" });
  const [showContactOrganizer, setShowContactOrganizer] = useState<string | null>(null);
  const [showExhibitors, setShowExhibitors] = useState<string | null>(null);
  const [organizer, setOrganizer] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [exhibitors, setExhibitors] = useState<{ _id: string; name: string; email: string; company?: string; phone?: string; boothNumber: string }[]>([]);
  const [messageForm, setMessageForm] = useState({ subject: "", message: "" });
  const [inbox, setInbox] = useState<{ _id: string; subject: string; message: string; fromUser: { name: string; company?: string }; read: boolean; createdAt: string }[]>([]);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    company: user?.company || "",
    phone: user?.phone || "",
    description: (user as { description?: string })?.description || "",
    productsServices: (user as { productsServices?: string })?.productsServices || "",
    avatar: (user as { avatar?: string })?.avatar || "",
  });

  const loadData = () => {
    if (user?.isApproved) {
      setLoading(true);
      Promise.all([
        exhibitorApi.getMyBooths(),
        applicationApi.getMyApplications(),
        messageApi.getInbox(),
      ])
        .then(([bRes, aRes, mRes]) => {
          setBooths(bRes.data.booths || []);
          setApplications(aRes.data.applications || []);
          setInbox(mRes.data.messages || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.isApproved]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        company: user.company || "",
        phone: user.phone || "",
        description: (user as { description?: string })?.description || "",
        productsServices: (user as { productsServices?: string })?.productsServices || "",
        avatar: (user as { avatar?: string })?.avatar || "",
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      await exhibitorApi.updateProfile(profile);
      setShowProfileForm(false);
    } catch {
      alert("Failed to update profile");
    }
  };

  const handleUpdateBooth = async (boothId: string) => {
    try {
      await exhibitorApi.updateMyBooth(boothId, boothEdit);
      setEditingBoothId(null);
      loadData();
    } catch {
      alert("Failed to update booth");
    }
  };

  const openBoothEdit = (b: Booth) => {
    setEditingBoothId(b._id);
    setBoothEdit({
      description: b.description || "",
      productsServices: b.productsServices || "",
      staffInfo: b.staffInfo || "",
    });
  };

  const loadOrganizer = (expoId: string) => {
    setShowContactOrganizer(expoId);
    setShowExhibitors(null);
    messageApi.getExpoOrganizer(expoId).then((res) => setOrganizer(res.data.organizer)).catch(() => setOrganizer(null));
  };

  const loadExhibitors = (expoId: string) => {
    setShowExhibitors(expoId);
    setShowContactOrganizer(null);
    messageApi.getExpoExhibitors(expoId).then((res) => setExhibitors(res.data.exhibitors || [])).catch(() => setExhibitors([]));
  };

  const handleSendMessage = async (toUserId: string, expoId?: string) => {
    try {
      await messageApi.send({ toUserId, expoId, subject: messageForm.subject, message: messageForm.message });
      setMessageForm({ subject: "", message: "" });
      setShowContactOrganizer(null);
    } catch {
      alert("Failed to send message");
    }
  };

  return (
    <div className="exhibitor-dashboard">
      <div className="portal-header">
        <h1>Exhibitor Portal</h1>
        <p className="welcome-msg">Welcome back, {user?.name}!</p>
      </div>
      {!user?.isApproved && (
        <div className="pending-banner">
          Your account is pending approval. You will be notified once approved.
        </div>
      )}
      {user?.isApproved && loading ? (
        <LoadingSpinner message="Loading your dashboard..." />
      ) : user?.isApproved && (
        <>
          <section className="exhibitor-section dashboard-section">
            <h2 className="dashboard-section-title">
              <span className="dashboard-section-icon">👤</span>
              Registration & Profile Management
            </h2>
            <p className="section-hint">Update your profile, including logo, description, and contact information.</p>
            <div className="profile-header">
              {profile.avatar && (
                <img src={profile.avatar} alt="Logo" className="profile-logo" />
              )}
              <button onClick={() => setShowProfileForm(!showProfileForm)}>
                {showProfileForm ? "Cancel" : "Edit Profile"}
              </button>
            </div>
            {showProfileForm && (
              <div className="profile-form">
                <div className="form-group">
                  <label>Logo / Avatar URL</label>
                  <input
                    placeholder="https://..."
                    value={profile.avatar}
                    onChange={(e) => setProfile((p) => ({ ...p, avatar: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    placeholder="Your name"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    placeholder="Company name"
                    value={profile.company}
                    onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    placeholder="Contact phone"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Company description"
                    value={profile.description}
                    onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Products / Services</label>
                  <textarea
                    placeholder="Products or services you offer"
                    value={profile.productsServices}
                    onChange={(e) => setProfile((p) => ({ ...p, productsServices: e.target.value }))}
                    rows={2}
                  />
                </div>
                <button onClick={handleUpdateProfile}>Save Profile</button>
              </div>
            )}
          </section>

          <section className="exhibitor-section dashboard-section">
            <h2 className="dashboard-section-title">
              <span className="dashboard-section-icon">🏪</span>
              Booth Selection & Management
            </h2>
            <p className="section-hint">View available booth spaces on floor plans, select and reserve based on preferences, and manage booth details (products/services, staff info).</p>
            <Link to="/expos" className="btn-browse">View Floor Plans & Reserve Booths</Link>
            {booths.length === 0 ? (
              <EmptyState
                icon="🏪"
                title="No booths yet"
                description="Apply for expos and reserve booths from the floor plan."
                action={
                  <Link to="/expos" className="btn-primary">
                    View Floor Plans
                  </Link>
                }
              />
            ) : (
              <div className="booth-cards">
                {booths.map((b) => (
                  <div key={b._id} className="booth-card-detail">
                    <div className="booth-card-header">
                      <strong>Booth {b.boothNumber}</strong>
                      <span className={`status-badge ${b.status}`}>{b.status}</span>
                      <span>{b.expoId?.title}</span>
                    </div>
                    {editingBoothId === b._id ? (
                      <div className="booth-edit-form">
                        <div className="form-group">
                          <label>Products/Services Showcased</label>
                          <textarea
                            value={boothEdit.productsServices}
                            onChange={(e) => setBoothEdit((p) => ({ ...p, productsServices: e.target.value }))}
                            rows={2}
                          />
                        </div>
                        <div className="form-group">
                          <label>Staff Information</label>
                          <textarea
                            value={boothEdit.staffInfo}
                            onChange={(e) => setBoothEdit((p) => ({ ...p, staffInfo: e.target.value }))}
                            placeholder="Staff names, roles, contact"
                            rows={2}
                          />
                        </div>
                        <div className="form-group">
                          <label>Booth Description</label>
                          <textarea
                            value={boothEdit.description}
                            onChange={(e) => setBoothEdit((p) => ({ ...p, description: e.target.value }))}
                            rows={2}
                          />
                        </div>
                        <div className="booth-edit-actions">
                          <button onClick={() => handleUpdateBooth(b._id)}>Save</button>
                          <button onClick={() => setEditingBoothId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {b.productsServices && <p><strong>Products:</strong> {b.productsServices}</p>}
                        {b.staffInfo && <p><strong>Staff:</strong> {b.staffInfo}</p>}
                        <div className="booth-actions">
                          <button onClick={() => navigate(`/expos/${b.expoId?._id}`)}>View Floor Plan</button>
                          <button onClick={() => openBoothEdit(b)}>Manage Booth</button>
                          <button onClick={() => loadOrganizer(b.expoId._id)}>Contact Organizer</button>
                          <button onClick={() => loadExhibitors(b.expoId._id)}>Other Exhibitors</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="exhibitor-section dashboard-section">
            <h2 className="dashboard-section-title">
              <span className="dashboard-section-icon">💬</span>
              Communication
            </h2>
            <p className="section-hint">Messages from organizers and other exhibitors.</p>
            {inbox.length === 0 ? (
              <EmptyState
                icon="💬"
                title="No messages yet"
                description="Use Contact Organizer from your booth to send inquiries."
              />
            ) : (
              <ul className="message-list">
                {inbox.slice(0, 5).map((m) => (
                  <li key={m._id} className={m.read ? "" : "unread"}>
                    <strong>{m.fromUser?.name}</strong>
                    {m.fromUser?.company && <span> ({m.fromUser.company})</span>}
                    {m.subject && <span> — {m.subject}</span>}
                    <p className="message-preview">{m.message.slice(0, 80)}{m.message.length > 80 ? "…" : ""}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="exhibitor-section dashboard-section">
            <h2 className="dashboard-section-title">
              <span className="dashboard-section-icon">📋</span>
              My Expo Applications
            </h2>
            {applications.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No applications yet"
                description="Browse expos and apply to exhibit."
                action={
                  <Link to="/expos" className="btn-primary">
                    Browse Expos
                  </Link>
                }
              />
            ) : (
              <ul className="application-list">
                {applications.map((a) => (
                  <li key={a._id}>
                    <span>{a.expoId?.title}</span>
                    <span className={`status-badge ${a.status}`}>{a.status}</span>
                    <Link to={`/expos/${a.expoId?._id}`}>View Expo</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(showContactOrganizer || showExhibitors) && (
            <div className="modal-overlay" onClick={() => { setShowContactOrganizer(null); setShowExhibitors(null); }}>
              <div className="modal communication-modal" onClick={(e) => e.stopPropagation()}>
                {showContactOrganizer && organizer && (
                  <>
                    <h3>Contact Organizer</h3>
                    <p><strong>{organizer.name}</strong> — {organizer.email}</p>
                    <div className="form-group">
                      <label>Subject</label>
                      <input
                        value={messageForm.subject}
                        onChange={(e) => setMessageForm((p) => ({ ...p, subject: e.target.value }))}
                        placeholder="Inquiry subject"
                      />
                    </div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea
                        value={messageForm.message}
                        onChange={(e) => setMessageForm((p) => ({ ...p, message: e.target.value }))}
                        placeholder="Your message..."
                        rows={4}
                        required
                      />
                    </div>
                    <div className="modal-actions">
                      <button onClick={() => handleSendMessage(organizer._id, showContactOrganizer)} disabled={!messageForm.message.trim()}>
                        Send Message
                      </button>
                      <button onClick={() => setShowContactOrganizer(null)}>Cancel</button>
                    </div>
                  </>
                )}
                {showContactOrganizer && !organizer && <p>No organizer found for this expo.</p>}
                {showExhibitors && (
                  <>
                    <h3>Exhibitors at Same Expo</h3>
                    <p className="section-hint">Connect with neighboring exhibitors for collaboration.</p>
                    {exhibitors.length === 0 ? (
                      <p>No other exhibitors at this expo yet.</p>
                    ) : (
                      <ul className="exhibitor-contact-list">
                        {exhibitors.map((ex) => (
                          <li key={ex._id}>
                            <strong>{ex.name}</strong> — Booth {ex.boothNumber}
                            {ex.company && <span> ({ex.company})</span>}
                            <br />
                            <a href={`mailto:${ex.email}`}>{ex.email}</a>
                            {ex.phone && <span> · {ex.phone}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button onClick={() => setShowExhibitors(null)}>Close</button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
