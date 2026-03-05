import React, { useState, useEffect } from "react";
import api from "../../services/api";

const STATUS_CONFIG = {
  DRAFT:     { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", label: "Draft" },
  SUBMITTED: { color: "#FFD166", bg: "rgba(255,209,102,0.1)", label: "Submitted" },
  APPROVED:  { color: "#00C9A7", bg: "rgba(0,201,167,0.1)",  label: "Approved" },
  LOCKED:    { color: "#6C63FF", bg: "rgba(108,99,255,0.1)", label: "Locked" },
  REJECTED:  { color: "#FF6B6B", bg: "rgba(255,107,107,0.1)", label: "Rejected" },
};

const AdminExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEnroll, setShowEnroll] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    exam_name: "", exam_date: "", start_time: "",
    duration_minutes: "", total_questions_allowed: 10,
    marks_correct: 4, marks_wrong: -1, assigned_staff: ""
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [examsRes, staffRes, studentsRes] = await Promise.all([
        api.get("/api/exams/"),
        api.get("/api/admin/staff/"),
        api.get("/api/admin/students/"),
      ]);
      setExams(examsRes.data);
      setStaff(staffRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    try {
      await api.post("/api/exams/create/", form);
      showToast("Exam created successfully! ✅");
      setShowCreate(false);
      setForm({
        exam_name: "", exam_date: "", start_time: "",
        duration_minutes: "", total_questions_allowed: 10,
        marks_correct: 4, marks_wrong: -1, assigned_staff: ""
      });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create exam", "error");
    }
  };

  const handleApprove = async (examId) => {
    try {
      await api.post(`/api/exams/${examId}/approve/`);
      showToast("Exam approved! ✅");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to approve", "error");
    }
  };

  const handleReject = async (examId) => {
    try {
      await api.post(`/api/exams/${examId}/reject/`);
      showToast("Exam rejected ❌");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to reject", "error");
    }
  };

  const handleEnroll = async () => {
    try {
      await api.post(`/api/admin/exams/${showEnroll}/enroll/`, {
        student_ids: selectedStudents
      });
      showToast("Students enrolled successfully! ✅");
      setShowEnroll(null);
      setSelectedStudents([]);
    } catch (err) {
      showToast("Failed to enroll students", "error");
    }
  };

  const filteredExams = filter === "ALL"
    ? exams
    : exams.filter(e => e.status === filter || e.workflow_status === filter);

  if (loading) return (
    <div style={s.loader}>
      <div style={s.loaderIcon}>📋</div>
      <div style={s.loaderText}>Loading Exams...</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .exam-card { animation: fadeUp 0.3s ease both; transition: all 0.2s; }
        .exam-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(108,99,255,0.1); }
        .action-btn { transition: all 0.15s; }
        .action-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .modal-overlay { animation: fadeUp 0.2s ease; }
        input:focus, select:focus { outline: none; border-color: #6C63FF !important; }
        .filter-btn { transition: all 0.15s; }
        .filter-btn:hover { border-color: #6C63FF !important; color: #6C63FF !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          ...s.toast,
          background: toast.type === "error" ? "#FF6B6B" : "#00C9A7",
          animation: "toastIn 0.3s ease"
        }}>
          {toast.msg}
        </div>
      )}

      <div style={s.root}>
        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <div style={s.pageTitle}>📋 Exam Management</div>
            <div style={s.pageSubtitle}>{exams.length} total exams</div>
          </div>
          <button
            className="action-btn"
            onClick={() => setShowCreate(true)}
            style={s.createBtn}
          >
            ➕ Create New Exam
          </button>
        </div>

        {/* Filter Bar */}
        <div style={s.filterBar}>
          {["ALL", "DRAFT", "SUBMITTED", "APPROVED", "LOCKED"].map(f => (
            <button
              key={f}
              className="filter-btn"
              onClick={() => setFilter(f)}
              style={{
                ...s.filterBtn,
                background: filter === f ? "#6C63FF" : "transparent",
                color: filter === f ? "#fff" : "rgba(26,26,46,0.6)",
                border: filter === f ? "1px solid #6C63FF" : "1px solid rgba(26,26,46,0.15)",
              }}
            >
              {f === "ALL" ? `All (${exams.length})` : f}
            </button>
          ))}
        </div>

        {/* Exams Grid */}
        {filteredExams.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No exams found</div>
            <div style={{ fontSize: 13, color: "rgba(26,26,46,0.5)", marginTop: 4 }}>
              Create your first exam to get started!
            </div>
          </div>
        ) : (
          <div style={s.grid}>
            {filteredExams.map((exam, i) => {
              const statusKey = exam.workflow_status || "DRAFT";
              const sc = STATUS_CONFIG[statusKey] || STATUS_CONFIG.DRAFT;
              return (
                <div
                  key={exam.id}
                  className="exam-card"
                  style={{ ...s.examCard, animationDelay: `${i * 0.06}s` }}
                >
                  {/* Card Header */}
                  <div style={s.cardTop}>
                    <div style={s.examIcon}>📝</div>
                    <span style={{ ...s.statusBadge, color: sc.color, background: sc.bg, border: `1px solid ${sc.color}33` }}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Exam Name */}
                  <div style={s.examName}>{exam.exam_name}</div>

                  {/* Details */}
                  <div style={s.detailsGrid}>
                    <div style={s.detail}>
                      <span style={s.detailIcon}>📅</span>
                      <span>{exam.exam_date}</span>
                    </div>
                    <div style={s.detail}>
                      <span style={s.detailIcon}>⏰</span>
                      <span>{exam.start_time}</span>
                    </div>
                    <div style={s.detail}>
                      <span style={s.detailIcon}>⏱️</span>
                      <span>{exam.duration} min</span>
                    </div>
                    <div style={s.detail}>
                      <span style={s.detailIcon}>👨‍🏫</span>
                      <span>{exam.assigned_staff_name || "Not assigned"}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={s.divider} />

                  {/* Actions */}
                  <div style={s.actions}>
                    {statusKey === "SUBMITTED" && (
                      <>
                        <button
                          className="action-btn"
                          onClick={() => handleApprove(exam.id)}
                          style={{ ...s.btn, ...s.btnApprove }}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => handleReject(exam.id)}
                          style={{ ...s.btn, ...s.btnReject }}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {statusKey === "APPROVED" && (
                      <button
                        className="action-btn"
                        onClick={() => { setShowEnroll(exam.id); setSelectedStudents([]); }}
                        style={{ ...s.btn, ...s.btnEnroll }}
                      >
                        👨‍🎓 Enroll Students
                      </button>
                    )}
                    {statusKey === "LOCKED" && (
                      <div style={s.lockedBadge}>
                        🔒 Paper Locked on Blockchain
                      </div>
                    )}
                    {statusKey === "DRAFT" && (
                      <div style={s.draftNote}>
                        ⏳ Waiting for staff submission
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE EXAM MODAL ── */}
      {showCreate && (
        <div style={s.overlay} onClick={() => setShowCreate(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>➕ Create New Exam</div>
              <button onClick={() => setShowCreate(false)} style={s.closeBtn}>✕</button>
            </div>

            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.label}>Exam Name *</label>
                <input
                  style={s.input}
                  placeholder="e.g. Mathematics Final Exam"
                  value={form.exam_name}
                  onChange={e => setForm({ ...form, exam_name: e.target.value })}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Assign Staff *</label>
                <select
                  style={s.input}
                  value={form.assigned_staff}
                  onChange={e => setForm({ ...form, assigned_staff: e.target.value })}
                >
                  <option value="">Select Staff</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.username}</option>
                  ))}
                </select>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Exam Date *</label>
                <input
                  style={s.input} type="date"
                  value={form.exam_date}
                  onChange={e => setForm({ ...form, exam_date: e.target.value })}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Start Time *</label>
                <input
                  style={s.input} type="time"
                  value={form.start_time}
                  onChange={e => setForm({ ...form, start_time: e.target.value })}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Duration (minutes) *</label>
                <input
                  style={s.input} type="number"
                  placeholder="e.g. 60"
                  value={form.duration_minutes}
                  onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Total Questions *</label>
                <input
                  style={s.input} type="number"
                  value={form.total_questions_allowed}
                  onChange={e => setForm({ ...form, total_questions_allowed: e.target.value })}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Marks per Correct Answer</label>
                <input
                  style={s.input} type="number"
                  value={form.marks_correct}
                  onChange={e => setForm({ ...form, marks_correct: e.target.value })}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Marks per Wrong Answer</label>
                <input
                  style={s.input} type="number"
                  value={form.marks_wrong}
                  onChange={e => setForm({ ...form, marks_wrong: e.target.value })}
                />
              </div>
            </div>

            <div style={s.modalFooter}>
              <button onClick={() => setShowCreate(false)} style={s.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleCreate} style={s.submitBtn}>
                ➕ Create Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENROLL STUDENTS MODAL ── */}
      {showEnroll && (
        <div style={s.overlay} onClick={() => setShowEnroll(null)}>
          <div style={{ ...s.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>👨‍🎓 Enroll Students</div>
              <button onClick={() => setShowEnroll(null)} style={s.closeBtn}>✕</button>
            </div>

            <div style={{ fontSize: 13, color: "rgba(26,26,46,0.5)", marginBottom: 16 }}>
              Select students to enroll in this exam
            </div>

            <div style={s.studentList}>
              {students.map(st => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudents(prev =>
                    prev.includes(st.id)
                      ? prev.filter(id => id !== st.id)
                      : [...prev, st.id]
                  )}
                  style={{
                    ...s.studentItem,
                    background: selectedStudents.includes(st.id)
                      ? "rgba(108,99,255,0.08)"
                      : "rgba(26,26,46,0.03)",
                    border: selectedStudents.includes(st.id)
                      ? "1px solid rgba(108,99,255,0.3)"
                      : "1px solid rgba(26,26,46,0.1)",
                  }}
                >
                  <div style={{
                    ...s.checkbox,
                    background: selectedStudents.includes(st.id) ? "#6C63FF" : "transparent",
                    border: selectedStudents.includes(st.id) ? "2px solid #6C63FF" : "2px solid rgba(26,26,46,0.3)",
                  }}>
                    {selectedStudents.includes(st.id) && "✓"}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{st.username}</div>
                    <div style={{ fontSize: 12, color: "rgba(26,26,46,0.5)" }}>{st.email}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.modalFooter}>
              <button onClick={() => setShowEnroll(null)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleEnroll} style={s.submitBtn}>
                ✅ Enroll {selectedStudents.length} Students
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const s = {
  root: { fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e", maxWidth: 1200 },
  loader: {
    minHeight: "60vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 12,
  },
  loaderIcon: { fontSize: 48 },
  loaderText: { fontSize: 16, color: "rgba(26,26,46,0.5)" },
  pageHeader: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 24,
  },
  pageTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 28, fontWeight: 800, color: "#1a1a2e", marginBottom: 4,
  },
  pageSubtitle: { fontSize: 13, color: "rgba(26,26,46,0.45)" },
  createBtn: {
    padding: "12px 24px",
    background: "#6C63FF", color: "#fff",
    border: "none", borderRadius: 10,
    cursor: "pointer", fontSize: 14, fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 16px rgba(108,99,255,0.3)",
    transition: "all 0.2s",
  },
  filterBar: { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  filterBtn: {
    padding: "8px 16px", borderRadius: 8,
    cursor: "pointer", fontSize: 13, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 20,
  },
  examCard: {
    background: "#fff",
    border: "1px solid rgba(26,26,46,0.08)",
    borderRadius: 16, padding: "20px",
    cursor: "default",
  },
  cardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  examIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: "rgba(108,99,255,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18,
  },
  statusBadge: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
    textTransform: "uppercase", padding: "4px 10px", borderRadius: 20,
  },
  examName: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 17, fontWeight: 700, color: "#1a1a2e", marginBottom: 14,
  },
  detailsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 },
  detail: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "rgba(26,26,46,0.6)",
    background: "rgba(26,26,46,0.03)",
    padding: "6px 10px", borderRadius: 8,
  },
  detailIcon: { fontSize: 13 },
  divider: { height: 1, background: "rgba(26,26,46,0.06)", marginBottom: 14 },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  btn: {
    padding: "8px 14px", borderRadius: 8,
    border: "none", cursor: "pointer",
    fontSize: 12, fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
  },
  btnApprove: { background: "rgba(0,201,167,0.12)", color: "#00C9A7" },
  btnReject: { background: "rgba(255,107,107,0.12)", color: "#FF6B6B" },
  btnEnroll: { background: "rgba(108,99,255,0.1)", color: "#6C63FF" },
  lockedBadge: {
    fontSize: 12, color: "#6C63FF", fontWeight: 600,
    background: "rgba(108,99,255,0.08)",
    padding: "6px 12px", borderRadius: 8,
  },
  draftNote: {
    fontSize: 12, color: "rgba(26,26,46,0.4)", fontWeight: 500,
    padding: "6px 12px", borderRadius: 8,
    background: "rgba(26,26,46,0.04)",
  },
  empty: {
    textAlign: "center", padding: "80px 20px",
    color: "rgba(26,26,46,0.4)",
  },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(10,10,20,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#fff", borderRadius: 20,
    padding: "28px", width: "90%", maxWidth: 640,
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
  },
  modalHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: 24,
  },
  modalTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 20, fontWeight: 800, color: "#1a1a2e",
  },
  closeBtn: {
    background: "rgba(26,26,46,0.06)", border: "none",
    borderRadius: 8, padding: "6px 10px",
    cursor: "pointer", fontSize: 14, color: "#1a1a2e",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: "rgba(26,26,46,0.6)", letterSpacing: "0.05em" },
  input: {
    padding: "10px 14px",
    border: "1px solid rgba(26,26,46,0.15)",
    borderRadius: 8, fontSize: 14, color: "#1a1a2e",
    fontFamily: "'DM Sans', sans-serif",
    background: "#fff", transition: "border-color 0.15s",
  },
  modalFooter: { display: "flex", gap: 12, justifyContent: "flex-end" },
  cancelBtn: {
    padding: "10px 20px", borderRadius: 8,
    border: "1px solid rgba(26,26,46,0.15)",
    background: "transparent", cursor: "pointer",
    fontSize: 14, fontWeight: 600, color: "rgba(26,26,46,0.6)",
    fontFamily: "'DM Sans', sans-serif",
  },
  submitBtn: {
    padding: "10px 24px", borderRadius: 8,
    background: "#6C63FF", color: "#fff",
    border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 12px rgba(108,99,255,0.3)",
  },
  studentList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, maxHeight: 320, overflowY: "auto" },
  studentItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 14px", borderRadius: 10, cursor: "pointer",
    transition: "all 0.15s",
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, color: "#fff", fontWeight: 800,
    flexShrink: 0, transition: "all 0.15s",
  },
  toast: {
    position: "fixed", bottom: 24, right: 24,
    padding: "14px 24px", borderRadius: 12,
    color: "#fff", fontSize: 14, fontWeight: 600,
    zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  },
};

export default AdminExamManagement;
