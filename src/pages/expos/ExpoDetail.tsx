import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { expoApi } from "../../api/expoApi";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { createSocket } from "../../utils/socket";
import { useAppSelector } from "../../store/hooks";
import { attendeeApi } from "../../api/attendeeApi";
import { exhibitorApi } from "../../api/exhibitorApi";
import { applicationApi } from "../../api/applicationApi";
import { bookmarkApi } from "../../api/bookmarkApi";
import { messageApi } from "../../api/messageApi";
import type { Expo, Booth, Session } from "../../types";

export function ExpoDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [expo, setExpo] = useState<Expo | null>(null);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [bookedSessionIds, setBookedSessionIds] = useState<Set<string>>(new Set());
  const [exhibitorSearch, setExhibitorSearch] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [appliedExpo, setAppliedExpo] = useState(false);
  const [approvedForExpo, setApprovedForExpo] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [expoApplications, setExpoApplications] = useState<
    { _id: string; exhibitorId: { name: string; company?: string }; status: string }[]
  >([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyData, setApplyData] = useState({ companyName: "", productsServices: "", documents: [] as { name: string; url: string }[] });
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("all");
  const [exhibitorBoothFilter, setExhibitorBoothFilter] = useState<string>("all");
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [contactExhibitor, setContactExhibitor] = useState<{ exhibitorId: string; name: string } | null>(null);
  const [contactMessage, setContactMessage] = useState({ subject: "", message: "" });
  const [manageBooth, setManageBooth] = useState<Booth | null>(null);
  const [boothEdit, setBoothEdit] = useState({ description: "", productsServices: "", staffInfo: "" });
  const [actionLoading, setActionLoading] = useState({
    register: false,
    bookSession: null as string | null,
    bookmark: null as string | null,
    apply: false,
    reserveBooth: null as string | null,
  });

  const isAdmin = user?.role === "admin" || user?.role === "organizer";

  const loadData = () => {
    if (!id) return;
    Promise.all([
      expoApi.getOne(id),
      expoApi.getBooths(id),
      expoApi.getSessions(id),
    ])
      .then(([expoRes, boothRes, sessionRes]) => {
        setExpo(expoRes.data.expo);
        setBooths(boothRes.data.booths || []);
        setSessions(sessionRes.data.sessions || []);
      })
      .catch(() => setExpo(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    const socket = createSocket(token || undefined);
    socket.emit("join-expo", id);
    socket.on("booths-updated", () => loadData());
    socket.on("sessions-updated", () => loadData());
    socket.on("expo-updated", () => loadData());
    return () => {
      socket.emit("leave-expo", id);
      socket.off("booths-updated");
      socket.off("sessions-updated");
      socket.off("expo-updated");
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (user?.role === "attendee" && id) {
      attendeeApi.getMyRegistrations().then((res) => {
        const regs = res.data.registrations || [];
        const isReg = regs.some(
          (r: { expoId?: { _id?: string }; type?: string }) => r.expoId?._id === id && r.type === "expo"
        );
        setRegistered(isReg);
        const booked = regs
          .filter((r: { type?: string; sessionId?: { _id?: string } }) => r.type === "session" && r.sessionId?._id)
          .map((r: { sessionId: { _id: string } }) => r.sessionId._id);
        setBookedSessionIds(new Set(booked));
      });
      bookmarkApi.getMyBookmarks().then((res) => {
        const bms = res.data.bookmarks || [];
        setBookmarkedIds(new Set(bms.map((b: { sessionId: { _id: string } }) => b.sessionId._id)));
      });
    }
    if (user?.role === "exhibitor" && id) {
      applicationApi.getMyApplications().then((res) => {
        const apps = res.data.applications || [];
        const myApp = apps.find((a: { expoId: { _id: string } }) => a.expoId._id === id);
        setAppliedExpo(!!myApp);
        setApprovedForExpo(myApp?.status === "approved");
      });
    }
    if (isAdmin && id) {
      applicationApi.getExpoApplications(id).then((res) => {
        setExpoApplications(res.data.applications || []);
      }).catch(() => setExpoApplications([]));
    }
  }, [user?.role, id, isAdmin]);

  const handleRegister = async () => {
    if (!id || !user) return;
    setActionLoading((p) => ({ ...p, register: true }));
    try {
      await attendeeApi.registerForExpo(id);
      setRegistered(true);
    } catch {
      alert("Registration failed");
    } finally {
      setActionLoading((p) => ({ ...p, register: false }));
    }
  };

  const handleBookSession = async (sessionId: string) => {
    if (bookedSessionIds.has(sessionId)) return;
    setActionLoading((p) => ({ ...p, bookSession: sessionId }));
    try {
      await attendeeApi.bookSession(sessionId);
      setBookedSessionIds((prev) => new Set([...prev, sessionId]));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Booking failed");
    } finally {
      setActionLoading((p) => ({ ...p, bookSession: null }));
    }
  };

  const handleBookmark = async (sessionId: string) => {
    setActionLoading((p) => ({ ...p, bookmark: sessionId }));
    try {
      if (bookmarkedIds.has(sessionId)) {
        await bookmarkApi.removeBookmark(sessionId);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(sessionId);
          return next;
        });
      } else {
        await bookmarkApi.bookmarkSession(sessionId);
        setBookmarkedIds((prev) => new Set([...prev, sessionId]));
      }
    } catch {
      alert("Failed to update bookmark");
    } finally {
      setActionLoading((p) => ({ ...p, bookmark: null }));
    }
  };

  const handleApplyForExpo = async () => {
    if (!id) return;
    setActionLoading((p) => ({ ...p, apply: true }));
    try {
      await applicationApi.apply(id, {
        companyName: applyData.companyName,
        productsServices: applyData.productsServices,
        documents: applyData.documents,
      });
      setAppliedExpo(true);
      setShowApplyForm(false);
      setApplyData({ companyName: "", productsServices: "", documents: [] });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Application failed");
    } finally {
      setActionLoading((p) => ({ ...p, apply: false }));
    }
  };

  const addDocument = () => {
    setApplyData((p) => ({
      ...p,
      documents: [...p.documents, { name: "", url: "" }],
    }));
  };

  const updateDocument = (idx: number, field: "name" | "url", val: string) => {
    setApplyData((p) => ({
      ...p,
      documents: p.documents.map((d, i) =>
        i === idx ? { ...d, [field]: val } : d
      ),
    }));
  };

  const removeDocument = (idx: number) => {
    setApplyData((p) => ({
      ...p,
      documents: p.documents.filter((_, i) => i !== idx),
    }));
  };

  const isMyBooth = (b: Booth) => {
    const ex = b.exhibitorId as { _id?: string } | null;
    return user?.role === "exhibitor" && ex?._id === user?._id;
  };

  const handleUpdateBooth = async () => {
    if (!manageBooth) return;
    try {
      await exhibitorApi.updateMyBooth(manageBooth._id, boothEdit);
      setManageBooth(null);
      loadData();
    } catch {
      alert("Failed to update booth");
    }
  };

  const openManageBooth = (b: Booth) => {
    setManageBooth(b);
    setBoothEdit({
      description: b.description || "",
      productsServices: b.productsServices || "",
      staffInfo: b.staffInfo || "",
    });
  };

  const handleReserveBooth = async (boothId: string) => {
    setActionLoading((p) => ({ ...p, reserveBooth: boothId }));
    try {
      await exhibitorApi.reserveBooth(boothId);
      loadData();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Reservation failed");
    } finally {
      setActionLoading((p) => ({ ...p, reserveBooth: null }));
    }
  };

  const handleSaveSession = async (data: Partial<Session>) => {
    if (!id) return;
    try {
      if (editingSession) {
        await expoApi.updateSession(id, editingSession._id, data);
      } else {
        await expoApi.createSession(id, data);
      }
      setShowSessionForm(false);
      setEditingSession(null);
      loadData();
    } catch {
      alert("Failed to save session");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!id || !confirm("Delete this session?")) return;
    try {
      await expoApi.deleteSession(id, sessionId);
      loadData();
    } catch {
      alert("Failed to delete session");
    }
  };

  const handleApproveApplication = async (appId: string) => {
    try {
      await applicationApi.approve(appId);
      setExpoApplications((prev) => prev.filter((a) => a._id !== appId));
      loadData();
    } catch {
      alert("Failed to approve");
    }
  };

  const handleRejectApplication = async (appId: string) => {
    try {
      await applicationApi.reject(appId);
      setExpoApplications((prev) => prev.filter((a) => a._id !== appId));
    } catch {
      alert("Failed to reject");
    }
  };

  const handleContactExhibitor = async () => {
    if (!contactExhibitor?.exhibitorId || !contactMessage.message.trim()) return;
    try {
      await messageApi.send({
        toUserId: contactExhibitor.exhibitorId,
        expoId: id,
        subject: contactMessage.subject,
        message: contactMessage.message,
      });
      setContactExhibitor(null);
      setContactMessage({ subject: "", message: "" });
    } catch {
      alert("Failed to send message");
    }
  };

  const filteredSessions = sessions.filter(
    (s) => sessionTypeFilter === "all" || s.type === sessionTypeFilter
  );

  const filteredBooths = booths.filter((b) => {
    if (user?.role === "exhibitor" && exhibitorBoothFilter === "available" && b.status !== "available") return false;
    if (!exhibitorSearch.trim()) return true;
    const search = exhibitorSearch.toLowerCase();
    const exhibitor = b.exhibitorId as { name?: string; company?: string; productsServices?: string; description?: string } | null;
    const boothProducts = (b.productsServices || "").toLowerCase();
    const boothDesc = (b.description || "").toLowerCase();
    const name = (exhibitor?.name || "").toLowerCase();
    const company = (exhibitor?.company || "").toLowerCase();
    const exhibitorProducts = (exhibitor?.productsServices || "").toLowerCase();
    const exhibitorDesc = (exhibitor?.description || "").toLowerCase();
    return (
      name.includes(search) ||
      company.includes(search) ||
      boothProducts.includes(search) ||
      boothDesc.includes(search) ||
      exhibitorProducts.includes(search) ||
      exhibitorDesc.includes(search)
    );
  });

  if (loading || !expo) return <LoadingSpinner message={loading ? "Loading expo..." : "Expo not found"} />;

  return (
    <div className="expo-detail">
      <div className="expo-detail-header">
        <div>
          <h1>{expo.title}</h1>
          <p className="expo-meta">
            <strong>Location:</strong> {expo.location} ·{" "}
            <strong>Date:</strong>{" "}
            {new Date(expo.date).toLocaleDateString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        {isAdmin && (
          <Link to={`/expos/${id}/edit`} className="btn-edit-expo">
            Edit Expo
          </Link>
        )}
      </div>
      {expo.description && <p>{expo.description}</p>}
      {user?.role === "attendee" && expo.status === "published" && (
        <button
          onClick={handleRegister}
          disabled={registered || actionLoading.register}
          className={registered ? "btn-disabled-state" : ""}
        >
          {actionLoading.register ? "Registering…" : registered ? "Registered ✓" : "Register for Expo"}
        </button>
      )}
      {user?.role === "exhibitor" && user?.isApproved && expo.status === "published" && (
        <>
          <button
            onClick={() => (appliedExpo ? null : setShowApplyForm(true))}
            disabled={appliedExpo || actionLoading.apply}
            className={appliedExpo ? "btn-disabled-state" : ""}
          >
            {actionLoading.apply ? "Submitting…" : appliedExpo ? (approvedForExpo ? "Approved for Expo ✓" : "Application Pending") : "Apply to Exhibit"}
          </button>
          {showApplyForm && (
            <div className="modal-overlay" onClick={() => setShowApplyForm(false)}>
              <div className="modal apply-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Apply to Exhibit</h3>
                <p>Provide your company details, products/services, and any required documents.</p>
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    value={applyData.companyName}
                    onChange={(e) => setApplyData((p) => ({ ...p, companyName: e.target.value }))}
                    placeholder="Your company name"
                  />
                </div>
                <div className="form-group">
                  <label>Products / Services</label>
                  <textarea
                    value={applyData.productsServices}
                    onChange={(e) => setApplyData((p) => ({ ...p, productsServices: e.target.value }))}
                    placeholder="Describe products or services you will showcase"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Documents (e.g. brochures, certificates)</label>
                  {applyData.documents.map((d, i) => (
                    <div key={i} className="document-row">
                      <input
                        placeholder="Document name"
                        value={d.name}
                        onChange={(e) => updateDocument(i, "name", e.target.value)}
                      />
                      <input
                        placeholder="URL"
                        value={d.url}
                        onChange={(e) => updateDocument(i, "url", e.target.value)}
                      />
                      <button type="button" onClick={() => removeDocument(i)}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="btn-add-doc" onClick={addDocument}>
                    + Add Document
                  </button>
                </div>
                <div className="modal-actions">
                  <button onClick={handleApplyForExpo} disabled={!applyData.companyName.trim() || actionLoading.apply}>
                    {actionLoading.apply ? "Submitting…" : "Submit Application"}
                  </button>
                  <button onClick={() => setShowApplyForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {isAdmin && expoApplications.filter((a) => a.status === "pending").length > 0 && (
        <section className="expo-applications">
          <h3>Pending Exhibitor Applications</h3>
          <ul>
            {expoApplications
              .filter((a) => a.status === "pending")
              .map((a) => (
                <li key={a._id}>
                  {(a.exhibitorId as { name: string }).name} —{" "}
                  {(a.exhibitorId as { company?: string }).company || "—"}
                  <button onClick={() => handleApproveApplication(a._id)}>Approve</button>
                  <button onClick={() => handleRejectApplication(a._id)}>Reject</button>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Schedule & Sessions</h2>
        {(user?.role === "attendee" || !user) && (
          <p className="schedule-hint">
            Browse event schedules, sessions, and workshops. Bookmark or register for sessions of interest.
          </p>
        )}
        <div className="schedule-toolbar">
          {isAdmin && (
            <>
              <button onClick={() => { setShowSessionForm(true); setEditingSession(null); }}>
                Add Session
              </button>
              <span className="toolbar-hint">Create sessions, assign speakers, topics, locations. Edit or delete anytime.</span>
            </>
          )}
          {sessions.length > 0 && (
            <div className="session-type-filter">
              <label>Filter by type:</label>
              <select
                value={sessionTypeFilter}
                onChange={(e) => setSessionTypeFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="keynote">Keynote</option>
                <option value="workshop">Workshop</option>
                <option value="panel">Panel</option>
                <option value="networking">Networking</option>
              </select>
            </div>
          )}
        </div>
        {(showSessionForm || editingSession) && (
          <SessionForm
            session={editingSession}
            onSave={handleSaveSession}
            onCancel={() => { setShowSessionForm(false); setEditingSession(null); }}
          />
        )}
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>No sessions yet.</p>
            {isAdmin && (
              <p className="empty-state-hint">
                Click &quot;Add Session&quot; above to create sessions for this expo.
              </p>
            )}
          </div>
        ) : (
          <ul className="session-list">
            {filteredSessions.map((s) => (
              <li key={s._id}>
                <strong>{s.title}</strong>
                {s.type && <span className={`session-type-badge ${s.type}`}>{s.type}</span>}
                {" — "}{s.speaker} @{" "}
                {new Date(s.timeSlot).toLocaleString()}
                {s.location && <span className="session-location"> · {s.location}</span>}
                {user?.role === "attendee" && (
                  <>
                    <button
                      onClick={() => handleBookSession(s._id)}
                      disabled={bookedSessionIds.has(s._id) || actionLoading.bookSession === s._id}
                      className={bookedSessionIds.has(s._id) ? "btn-disabled-state" : ""}
                      title={bookedSessionIds.has(s._id) ? "Already booked" : "Book this session"}
                    >
                      {actionLoading.bookSession === s._id ? "Booking…" : bookedSessionIds.has(s._id) ? "Booked ✓" : "Book Session"}
                    </button>
                    <button
                      className={`bookmark-btn ${bookmarkedIds.has(s._id) ? "bookmark-btn--active" : ""}`}
                      onClick={() => handleBookmark(s._id)}
                      disabled={actionLoading.bookmark === s._id}
                      title={bookmarkedIds.has(s._id) ? "Remove bookmark" : "Bookmark"}
                    >
                      {actionLoading.bookmark === s._id ? "…" : bookmarkedIds.has(s._id) ? "★" : "☆"}
                    </button>
                  </>
                )}
                {isAdmin && (
                  <>
                    <button onClick={() => setEditingSession(s)}>Edit</button>
                    <button onClick={() => handleDeleteSession(s._id)}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Exhibitors & Booths (Floor Plan)</h2>
        {user?.role === "exhibitor" && approvedForExpo && (
          <p className="floor-plan-hint">
            View available booth spaces below. Select and reserve a booth based on your preferences (size, location).
          </p>
        )}
        {booths.length > 0 && (
          <div className="exhibitor-search">
            <input
              type="text"
              placeholder="Search by name, company, products, or keywords..."
              value={exhibitorSearch}
              onChange={(e) => setExhibitorSearch(e.target.value)}
            />
            {user?.role === "exhibitor" && approvedForExpo && (
              <select
                value={exhibitorBoothFilter}
                onChange={(e) => setExhibitorBoothFilter(e.target.value)}
                className="booth-filter"
              >
                <option value="all">All booths</option>
                <option value="available">Available only</option>
              </select>
            )}
          </div>
        )}
        {booths.length === 0 ? (
          <div className="empty-state">
            <p>No booths yet.</p>
            {isAdmin ? (
              <>
                <p className="empty-state-hint">
                  As an Admin or Organizer, you can add booth spaces from the expo edit page.
                </p>
                <Link to={`/expos/${id}/edit`} className="btn-add-booths">
                  Add Booths
                </Link>
              </>
            ) : (
              <p className="empty-state-hint">
                Booth spaces will appear here once the organizer adds them. Exhibitors can then reserve booths.
              </p>
            )}
          </div>
        ) : (
          <div className="booth-grid">
            {filteredBooths.map((b) => {
              const exhibitor = b.exhibitorId as { _id?: string; name?: string; company?: string; email?: string; phone?: string; description?: string; productsServices?: string; avatar?: string } | null;
              const myBooth = isMyBooth(b);
              return (
                <div
                  key={b._id}
                  className={`booth-card ${b.status} ${exhibitor ? "has-exhibitor" : ""} ${user?.role === "exhibitor" && b.status === "available" ? "available-for-reserve" : ""} ${myBooth ? "booth-card--my-booth" : ""}`}
                  onClick={() => {
                    if (myBooth) openManageBooth(b);
                    else if (exhibitor && (user?.role === "attendee" || !user)) setSelectedBooth(b);
                  }}
                  role={myBooth ? "button" : undefined}
                  tabIndex={myBooth ? 0 : undefined}
                  onKeyDown={myBooth ? (e) => e.key === "Enter" && openManageBooth(b) : undefined}
                >
                  <span>Booth {b.boothNumber}</span>
                  {b.size && <span className="booth-size">{b.size}</span>}
                  <span className={`status-badge ${b.status}`}>{b.status}</span>
                  {exhibitor && (
                    <>
                      <p className="booth-exhibitor-name">
                        {exhibitor.name}
                        {exhibitor.company && exhibitor.company !== exhibitor.name && (
                          <span className="booth-exhibitor-company"> · {exhibitor.company}</span>
                        )}
                      </p>
                      {myBooth && (
                        <span className="btn-manage-booth">Manage Booth</span>
                      )}
                      {(user?.role === "attendee" || !user) && (
                        <button
                          className="btn-view-profile"
                          onClick={(e) => { e.stopPropagation(); setSelectedBooth(b); }}
                        >
                          View Profile
                        </button>
                      )}
                    </>
                  )}
                  {!exhibitor && <p className="booth-empty">Available — Reserve this booth</p>}
                  {user?.role === "exhibitor" &&
                    b.status === "available" &&
                    approvedForExpo && (
                      <button
                        className="btn-reserve"
                        onClick={(e) => { e.stopPropagation(); handleReserveBooth(b._id); }}
                        disabled={actionLoading.reserveBooth === b._id}
                      >
                        {actionLoading.reserveBooth === b._id ? "Reserving…" : "Reserve Booth"}
                      </button>
                    )}
                </div>
              );
            })}
          </div>
        )}

        {selectedBooth && (user?.role === "attendee" || !user) && (
          <div className="modal-overlay" onClick={() => setSelectedBooth(null)}>
            <div className="modal exhibitor-profile-modal" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const ex = selectedBooth.exhibitorId as { _id?: string; name?: string; company?: string; email?: string; phone?: string; description?: string; productsServices?: string; avatar?: string } | null;
                if (!ex) return null;
                return (
                  <>
                    <h3>Exhibitor Profile</h3>
                    <div className="exhibitor-profile">
                      {ex.avatar && <img src={ex.avatar} alt="" className="exhibitor-avatar" />}
                      <p><strong>{ex.name}</strong></p>
                      {ex.company && <p>{ex.company}</p>}
                      <p className="booth-location">Booth {selectedBooth.boothNumber}</p>
                      {(selectedBooth.productsServices || ex.productsServices) && (
                        <p><strong>Products/Services:</strong> {selectedBooth.productsServices || ex.productsServices}</p>
                      )}
                      {(selectedBooth.description || ex.description) && (
                        <p>{selectedBooth.description || ex.description}</p>
                      )}
                      {ex.email && <p><a href={`mailto:${ex.email}`}>{ex.email}</a></p>}
                      {ex.phone && <p>{ex.phone}</p>}
                    </div>
                    {user?.role === "attendee" && (
                      <button
                        className="btn-contact"
                        onClick={() => {
                          setSelectedBooth(null);
                          setContactExhibitor({ exhibitorId: ex._id!, name: ex.name || "" });
                        }}
                      >
                        Send Message
                      </button>
                    )}
                    <button onClick={() => setSelectedBooth(null)}>Close</button>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {contactExhibitor && user?.role === "attendee" && (
          <div className="modal-overlay" onClick={() => setContactExhibitor(null)}>
            <div className="modal contact-exhibitor-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Contact {contactExhibitor.name}</h3>
              <div className="form-group">
                <label>Subject</label>
                <input
                  value={contactMessage.subject}
                  onChange={(e) => setContactMessage((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Inquiry subject"
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={contactMessage.message}
                  onChange={(e) => setContactMessage((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Your message..."
                  rows={4}
                  required
                />
              </div>
              <div className="modal-actions">
                <button onClick={handleContactExhibitor} disabled={!contactMessage.message.trim()}>
                  Send
                </button>
                <button onClick={() => setContactExhibitor(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {manageBooth && user?.role === "exhibitor" && (
          <div className="modal-overlay" onClick={() => setManageBooth(null)}>
            <div className="modal booth-manage-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Manage Booth {manageBooth.boothNumber}</h3>
              <p className="booth-manage-expo">{expo?.title}</p>
              <div className="form-group">
                <label>Products / Services Showcased</label>
                <textarea
                  value={boothEdit.productsServices}
                  onChange={(e) => setBoothEdit((p) => ({ ...p, productsServices: e.target.value }))}
                  placeholder="Products or services you offer at this booth"
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Booth Description</label>
                <textarea
                  value={boothEdit.description}
                  onChange={(e) => setBoothEdit((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of your booth"
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
              <div className="modal-actions">
                <button onClick={handleUpdateBooth} className="btn-primary">Save Changes</button>
                <button onClick={() => setManageBooth(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SessionForm({
  session,
  onSave,
  onCancel,
}: {
  session: Session | null;
  onSave: (data: Partial<Session>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(session?.title || "");
  const [speaker, setSpeaker] = useState(session?.speaker || "");
  const [speakerBio, setSpeakerBio] = useState(session?.speakerBio || (session as { speakerBio?: string })?.speakerBio || "");
  const [timeSlot, setTimeSlot] = useState(
    session?.timeSlot
      ? new Date(session.timeSlot).toISOString().slice(0, 16)
      : ""
  );
  const [duration, setDuration] = useState(session?.duration ?? 60);
  const [description, setDescription] = useState(session?.description || "");
  const [location, setLocation] = useState(session?.location || "");
  const [type, setType] = useState(session?.type || "keynote");

  return (
    <div className="session-form modal">
      <h3>{session ? "Edit Session" : "Add Session"}</h3>
      <p className="session-form-hint">Create and manage sessions with time slots, speakers, topics, and locations.</p>
      <div className="form-group">
        <label>Topic / Title *</label>
        <input
          placeholder="Session topic or title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Speaker *</label>
        <input
          placeholder="Speaker name"
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Speaker Bio</label>
        <textarea
          placeholder="Brief speaker biography"
          value={speakerBio}
          onChange={(e) => setSpeakerBio(e.target.value)}
          rows={2}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Time Slot *</label>
          <input
            type="datetime-local"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Duration (minutes)</label>
          <input
            type="number"
            min={15}
            max={480}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 60)}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Location</label>
        <input
          placeholder="Room or venue location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Session Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="keynote">Keynote</option>
          <option value="workshop">Workshop</option>
          <option value="panel">Panel</option>
          <option value="networking">Networking</option>
        </select>
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          placeholder="Session description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="modal-actions">
        <button
          onClick={() =>
            onSave({
              title,
              speaker,
              speakerBio,
              timeSlot: timeSlot ? new Date(timeSlot).toISOString() : undefined,
              duration,
              description,
              location,
              type,
            })
          }
          disabled={!title.trim() || !speaker.trim() || !timeSlot}
        >
          {session ? "Update Session" : "Create Session"}
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
